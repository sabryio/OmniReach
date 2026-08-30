//! Rolling-window rate-limit quota calculator.
//!
//! # Contract
//! This is a **deep module**: the interface is two functions and one struct;
//! the logic inside handles all edge cases for rolling 1-hour and 24-hour
//! windows.
//!
//! The same spec is mirrored in the TypeScript frontend scheduler
//! (`useCampaignsList` / scheduler loop). Both must produce identical
//! `can_send` decisions for the same inputs.
//!
//! # No I/O
//! Pure function — takes timestamps and limits, returns a decision.
//! The caller (store or server layer) is responsible for persisting updates.

use crate::types::Session;

/// Result of a quota check for one session at a given instant.
#[derive(Debug, Clone)]
pub struct QuotaCheck {
    pub can_send: bool,
    /// Human-readable reason when `can_send = false`.
    pub reason: Option<String>,
    /// Milliseconds until the next available hourly slot, if hourly-capped.
    pub next_hourly_slot_ms: Option<i64>,
    /// Milliseconds until the next available daily slot, if daily-capped.
    pub next_daily_slot_ms: Option<i64>,
    /// Number of messages sent in the current rolling hour.
    pub hourly_used: usize,
    /// Number of messages sent in the current rolling 24-hour window.
    pub daily_used: usize,
    /// Remaining sends allowed this hour.
    pub hourly_remaining: i64,
    /// Remaining sends allowed today.
    pub daily_remaining: i64,
}

/// Check whether `session` can send at `now_ms` (Unix epoch milliseconds).
///
/// Uses a rolling window: only timestamps within the last hour / 24 hours
/// count against the limits.
pub fn check_quota(session: &Session, now_ms: i64) -> QuotaCheck {
    let one_hour_ago = now_ms - 3_600_000;
    let one_day_ago = now_ms - 86_400_000;

    let hourly_used = session
        .hourly_sent_timestamps
        .iter()
        .filter(|&&t| t > one_hour_ago)
        .count();

    let daily_used = session
        .daily_sent_timestamps
        .iter()
        .filter(|&&t| t > one_day_ago)
        .count();

    let hourly_limit = session.hourly_limit as usize;
    let daily_limit = session.daily_limit as usize;

    let is_hourly_capped = hourly_used >= hourly_limit;
    let is_daily_capped = daily_used >= daily_limit;

    let hourly_remaining = (hourly_limit as i64 - hourly_used as i64).max(0);
    let daily_remaining = (daily_limit as i64 - daily_used as i64).max(0);

    // Calculate when the oldest in-window timestamp rolls out of the window.
    let next_hourly_slot_ms = if is_hourly_capped {
        session
            .hourly_sent_timestamps
            .iter()
            .filter(|&&t| t > one_hour_ago)
            .min()
            .map(|oldest| oldest + 3_600_000 - now_ms)
    } else {
        None
    };

    let next_daily_slot_ms = if is_daily_capped {
        session
            .daily_sent_timestamps
            .iter()
            .filter(|&&t| t > one_day_ago)
            .min()
            .map(|oldest| oldest + 86_400_000 - now_ms)
    } else {
        None
    };

    let can_send = !is_hourly_capped && !is_daily_capped;

    let reason = if is_hourly_capped {
        Some(format!(
            "Hourly limit reached ({}/{})",
            hourly_used, hourly_limit
        ))
    } else if is_daily_capped {
        Some(format!(
            "Daily limit reached ({}/{})",
            daily_used, daily_limit
        ))
    } else {
        None
    };

    QuotaCheck {
        can_send,
        reason,
        next_hourly_slot_ms,
        next_daily_slot_ms,
        hourly_used,
        daily_used,
        hourly_remaining,
        daily_remaining,
    }
}

/// How many total slots are available across all sessions right now.
///
/// Used by the frontend-driven scheduler tick to decide how many items
/// to include in one `POST /api/scheduler/tick` request.
pub fn total_available_slots(sessions: &[Session], now_ms: i64) -> usize {
    sessions
        .iter()
        .map(|s| {
            let q = check_quota(s, now_ms);
            if q.can_send {
                q.hourly_remaining.min(q.daily_remaining) as usize
            } else {
                0
            }
        })
        .sum()
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::types::{Session, SessionStatus};
    use uuid::Uuid;

    fn make_session(hourly_limit: i64, daily_limit: i64, timestamps: Vec<i64>) -> Session {
        Session {
            id: Uuid::new_v4(),
            name: "test".into(),
            phone_number: None,
            status: SessionStatus::Connected,
            api_key: "key".into(),
            hourly_limit,
            daily_limit,
            hourly_sent_timestamps: timestamps.clone(),
            daily_sent_timestamps: timestamps,
            qr_code_data: None,
            last_activity_at: None,
        }
    }

    #[test]
    fn can_send_when_under_limit() {
        let session = make_session(20, 200, vec![]);
        let q = check_quota(&session, 1_000_000);
        assert!(q.can_send);
        assert_eq!(q.hourly_remaining, 20);
    }

    #[test]
    fn blocked_when_at_hourly_limit() {
        let now = 10_000_000i64;
        let recent: Vec<i64> = (0..5).map(|i| now - i * 60_000).collect();
        let session = make_session(5, 200, recent);
        let q = check_quota(&session, now);
        assert!(!q.can_send);
        assert!(q.reason.as_deref().unwrap_or("").contains("Hourly"));
    }

    #[test]
    fn old_timestamps_do_not_count() {
        let now = 10_000_000i64;
        // 5 timestamps all more than one hour ago
        let old: Vec<i64> = (1..=5).map(|i| now - i * 4_000_000).collect();
        let session = make_session(5, 200, old);
        let q = check_quota(&session, now);
        assert!(q.can_send, "old timestamps must not block sends");
    }
}
