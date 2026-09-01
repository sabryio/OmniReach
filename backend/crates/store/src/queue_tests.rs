//! Queue store integration tests
//!
//! Tests verify:
//! - Queue item CRUD operations
//! - Status transitions and attempts increment
//! - Campaign filtering and stats aggregation
//! - Batch operations (list_by_ids, requeue_failed)
//! - Data integrity across operations

#[cfg(test)]
mod tests {
    use crate::{campaigns, contacts, db::Db, queue};
    use omnireach_core::types::{
        Campaign, Contact, CreateCampaignInput, CreateContactInput, QueueItem, QueueItemStatus,
    };
    use sqlx::SqlitePool;
    use std::collections::HashMap;
    use uuid::Uuid;

    /// Helper: Create an in-memory SQLite database with migrations applied
    async fn setup_test_db() -> Db {
        let pool = SqlitePool::connect("sqlite::memory:")
            .await
            .expect("Failed to create in-memory database");

        sqlx::query("PRAGMA journal_mode = WAL")
            .execute(&pool)
            .await
            .expect("Failed to set WAL mode");

        sqlx::migrate!("./src/migrations")
            .run(&pool)
            .await
            .expect("Failed to run migrations");

        Db::from(pool)
    }

    /// Helper: Create a test campaign with contacts
    async fn create_test_campaign(
        db: &Db,
        title: &str,
        contact_count: usize,
    ) -> (Campaign, Vec<Contact>) {
        let contacts_input: Vec<CreateContactInput> = (0..contact_count)
            .map(|i| CreateContactInput {
                name: format!("Contact {}", i),
                raw_phone: format!("+20100000{:04}", i),
                formatted_phone: format!("+20 100 000 {:04}", i),
                normalized_phone: format!("20100000{:04}", i),
                custom_fields: HashMap::new(),
            })
            .collect();

        let campaign_input = CreateCampaignInput {
            title: title.to_string(),
            template_text: "Hello {{name}}".to_string(),
            image_url: None,
            session_ids: vec![],
            media_ref: None,
            contacts: contacts_input,
        };

        let campaign = campaigns::insert(db, campaign_input)
            .await
            .expect("Failed to create campaign");

        let contacts = contacts::list_by_campaign(db, campaign.id)
            .await
            .expect("Failed to list contacts");

        (campaign, contacts)
    }

    /// Helper: Create queue items for a campaign
    async fn create_queue_items(db: &Db, campaign: &Campaign, contacts: &[Contact]) -> Vec<Uuid> {
        let mut ids = vec![];

        for contact in contacts {
            let item = QueueItem {
                id: Uuid::new_v4(),
                campaign_id: campaign.id,
                campaign_title: campaign.title.clone(),
                contact_id: contact.id,
                phone: contact.normalized_phone.clone(),
                recipient_name: Some(contact.name.clone()),
                rendered_text: format!("Hello {}", contact.name),
                image_url: campaign.image_url.clone(),
                media_ref: None,
                status: QueueItemStatus::Pending,
                assigned_session_id: None,
                attempts: 0,
                last_error: None,
                sent_at: None,
                scheduled_for: None,
                rate_limit_hold_until: None,
                time_window_hold_until: None,
                response_payload: None,
            };

            // Insert via raw SQL since there's no queue::insert function yet
            sqlx::query!(
                r#"
                INSERT INTO queue_items (
                    id, campaign_id, campaign_title, contact_id, phone, recipient_name,
                    rendered_text, image_url, status, attempts
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                "#,
                item.id.to_string(),
                item.campaign_id.to_string(),
                item.campaign_title,
                item.contact_id.to_string(),
                item.phone,
                item.recipient_name,
                item.rendered_text,
                item.image_url,
                "pending",
                item.attempts
            )
            .execute(db.pool())
            .await
            .expect("Failed to insert queue item");

            ids.push(item.id);
        }

        ids
    }

    // ──────────────────────────────────────────────────────────────────────
    // Basic CRUD Operations
    // ──────────────────────────────────────────────────────────────────────

    #[tokio::test]
    async fn test_list_all_returns_all_items() {
        let db = setup_test_db().await;
        let (campaign, contacts) = create_test_campaign(&db, "Test Campaign", 5).await;
        create_queue_items(&db, &campaign, &contacts).await;

        let items = queue::list_all(&db, None).await.unwrap();

        assert_eq!(items.len(), 5, "Should return all queue items");
        assert!(
            items.iter().all(|i| i.campaign_id == campaign.id),
            "All items should belong to the test campaign"
        );
    }

    #[tokio::test]
    async fn test_list_all_with_campaign_filter() {
        let db = setup_test_db().await;
        let (campaign1, contacts1) = create_test_campaign(&db, "Campaign 1", 3).await;
        let (campaign2, contacts2) = create_test_campaign(&db, "Campaign 2", 2).await;

        create_queue_items(&db, &campaign1, &contacts1).await;
        create_queue_items(&db, &campaign2, &contacts2).await;

        let items = queue::list_all(&db, Some(campaign1.id)).await.unwrap();

        assert_eq!(items.len(), 3, "Should return only campaign 1 items");
        assert!(
            items.iter().all(|i| i.campaign_id == campaign1.id),
            "All items should belong to campaign 1"
        );
    }

    #[tokio::test]
    async fn test_get_by_id_returns_correct_item() {
        let db = setup_test_db().await;
        let (campaign, contacts) = create_test_campaign(&db, "Test Campaign", 3).await;
        let ids = create_queue_items(&db, &campaign, &contacts).await;

        let item = queue::get_by_id(&db, ids[1]).await.unwrap();

        assert_eq!(item.id, ids[1], "Should return correct item by ID");
        assert_eq!(
            item.contact_id, contacts[1].id,
            "Should match correct contact"
        );
    }

    #[tokio::test]
    async fn test_get_by_id_not_found() {
        let db = setup_test_db().await;
        let fake_id = Uuid::new_v4();

        let result = queue::get_by_id(&db, fake_id).await;

        assert!(result.is_err(), "Should return error for non-existent ID");
        assert!(
            matches!(result.unwrap_err(), crate::StoreError::NotFound(_)),
            "Should be NotFound error"
        );
    }

    #[tokio::test]
    async fn test_list_by_ids_returns_correct_items() {
        let db = setup_test_db().await;
        let (campaign, contacts) = create_test_campaign(&db, "Test Campaign", 5).await;
        let ids = create_queue_items(&db, &campaign, &contacts).await;

        let selected_ids = vec![ids[0], ids[2], ids[4]];
        let items = queue::list_by_ids(&db, &selected_ids).await.unwrap();

        assert_eq!(items.len(), 3, "Should return exactly 3 items");

        let returned_ids: Vec<Uuid> = items.iter().map(|i| i.id).collect();
        assert!(
            returned_ids.contains(&ids[0]),
            "Should contain first selected ID"
        );
        assert!(
            returned_ids.contains(&ids[2]),
            "Should contain second selected ID"
        );
        assert!(
            returned_ids.contains(&ids[4]),
            "Should contain third selected ID"
        );
    }

    #[tokio::test]
    async fn test_list_by_ids_empty_input() {
        let db = setup_test_db().await;

        let items = queue::list_by_ids(&db, &[]).await.unwrap();

        assert_eq!(items.len(), 0, "Empty input should return empty result");
    }

    // ──────────────────────────────────────────────────────────────────────
    // Status Transitions
    // ──────────────────────────────────────────────────────────────────────

    #[tokio::test]
    async fn test_update_status_to_sent() {
        let db = setup_test_db().await;
        let (campaign, contacts) = create_test_campaign(&db, "Test Campaign", 1).await;
        let ids = create_queue_items(&db, &campaign, &contacts).await;
        let session_id = Uuid::new_v4();

        let updated = queue::update_status(
            &db,
            ids[0],
            QueueItemStatus::Sent,
            Some(session_id),
            None,
            Some("{}".to_string()),
        )
        .await
        .unwrap();

        assert_eq!(updated.status, QueueItemStatus::Sent);
        assert_eq!(updated.assigned_session_id, Some(session_id));
        assert_eq!(updated.attempts, 1, "Attempts should increment to 1");
        assert!(updated.sent_at.is_some(), "sent_at should be populated");
        assert_eq!(updated.response_payload, Some("{}".to_string()));
    }

    #[tokio::test]
    async fn test_update_status_to_failed_with_error() {
        let db = setup_test_db().await;
        let (campaign, contacts) = create_test_campaign(&db, "Test Campaign", 1).await;
        let ids = create_queue_items(&db, &campaign, &contacts).await;

        let updated = queue::update_status(
            &db,
            ids[0],
            QueueItemStatus::Failed,
            None,
            Some("Network timeout".to_string()),
            None,
        )
        .await
        .unwrap();

        assert_eq!(updated.status, QueueItemStatus::Failed);
        assert_eq!(
            updated.last_error,
            Some("Network timeout".to_string()),
            "Error message should be recorded"
        );
        assert_eq!(updated.attempts, 1, "Attempts should increment");
    }

    #[tokio::test]
    async fn test_update_status_increments_attempts() {
        let db = setup_test_db().await;
        let (campaign, contacts) = create_test_campaign(&db, "Test Campaign", 1).await;
        let ids = create_queue_items(&db, &campaign, &contacts).await;

        // First attempt: fail
        queue::update_status(
            &db,
            ids[0],
            QueueItemStatus::Failed,
            None,
            Some("Attempt 1".to_string()),
            None,
        )
        .await
        .unwrap();

        // Second attempt: fail again
        queue::update_status(
            &db,
            ids[0],
            QueueItemStatus::Failed,
            None,
            Some("Attempt 2".to_string()),
            None,
        )
        .await
        .unwrap();

        // Third attempt: succeed
        let final_item = queue::update_status(&db, ids[0], QueueItemStatus::Sent, None, None, None)
            .await
            .unwrap();

        assert_eq!(
            final_item.attempts, 3,
            "Attempts should increment with each update"
        );
    }

    // ──────────────────────────────────────────────────────────────────────
    // Campaign Operations
    // ──────────────────────────────────────────────────────────────────────

    #[tokio::test]
    async fn test_list_pending_for_campaign() {
        let db = setup_test_db().await;
        let (campaign, contacts) = create_test_campaign(&db, "Test Campaign", 5).await;
        let ids = create_queue_items(&db, &campaign, &contacts).await;

        // Mark some as sent
        queue::update_status(&db, ids[0], QueueItemStatus::Sent, None, None, None)
            .await
            .unwrap();
        queue::update_status(&db, ids[2], QueueItemStatus::Sent, None, None, None)
            .await
            .unwrap();

        let pending = queue::list_pending_for_campaign(&db, campaign.id)
            .await
            .unwrap();

        assert_eq!(pending.len(), 3, "Should return 3 pending items");
        assert!(
            pending.iter().all(|i| i.status == QueueItemStatus::Pending),
            "All returned items should be pending"
        );
    }

    #[tokio::test]
    async fn test_cancel_item() {
        let db = setup_test_db().await;
        let (campaign, contacts) = create_test_campaign(&db, "Test Campaign", 1).await;
        let ids = create_queue_items(&db, &campaign, &contacts).await;

        let cancelled = queue::cancel(&db, ids[0]).await.unwrap();

        assert_eq!(
            cancelled.status,
            QueueItemStatus::Cancelled,
            "Status should be cancelled"
        );

        // Verify persistence
        let item = queue::get_by_id(&db, ids[0]).await.unwrap();
        assert_eq!(item.status, QueueItemStatus::Cancelled);
    }

    #[tokio::test]
    async fn test_requeue_failed_items() {
        let db = setup_test_db().await;
        let (campaign, contacts) = create_test_campaign(&db, "Test Campaign", 5).await;
        let ids = create_queue_items(&db, &campaign, &contacts).await;

        // Mark 3 items as failed
        for i in 0..3 {
            queue::update_status(
                &db,
                ids[i],
                QueueItemStatus::Failed,
                None,
                Some("Test error".to_string()),
                None,
            )
            .await
            .unwrap();
        }

        // Mark 1 as sent
        queue::update_status(&db, ids[3], QueueItemStatus::Sent, None, None, None)
            .await
            .unwrap();

        let count = queue::requeue_failed(&db, campaign.id).await.unwrap();

        assert_eq!(count, 3, "Should have requeued 3 failed items");

        // Verify items are now pending with reset attempts
        let items = queue::list_all(&db, Some(campaign.id)).await.unwrap();
        let requeued = items
            .iter()
            .filter(|i| i.status == QueueItemStatus::Pending)
            .collect::<Vec<_>>();

        assert_eq!(
            requeued.len(),
            4,
            "Should have 4 pending items (3 requeued + 1 original)"
        );

        // Check that requeued items have cleared attempts and errors
        for item in items.iter() {
            if item.id == ids[0] || item.id == ids[1] || item.id == ids[2] {
                assert_eq!(item.attempts, 0, "Attempts should be reset to 0");
                assert!(item.last_error.is_none(), "Error should be cleared");
            }
        }
    }

    // ──────────────────────────────────────────────────────────────────────
    // Stats Aggregation
    // ──────────────────────────────────────────────────────────────────────

    #[tokio::test]
    async fn test_stats_aggregation() {
        let db = setup_test_db().await;
        let (campaign, contacts) = create_test_campaign(&db, "Test Campaign", 10).await;
        let ids = create_queue_items(&db, &campaign, &contacts).await;

        // Create a distribution:
        // 3 pending, 2 sending, 2 sent, 2 failed, 1 held_rate_limit
        queue::update_status(&db, ids[0], QueueItemStatus::Sending, None, None, None)
            .await
            .unwrap();
        queue::update_status(&db, ids[1], QueueItemStatus::Sending, None, None, None)
            .await
            .unwrap();
        queue::update_status(&db, ids[2], QueueItemStatus::Sent, None, None, None)
            .await
            .unwrap();
        queue::update_status(&db, ids[3], QueueItemStatus::Sent, None, None, None)
            .await
            .unwrap();
        queue::update_status(&db, ids[4], QueueItemStatus::Failed, None, None, None)
            .await
            .unwrap();
        queue::update_status(&db, ids[5], QueueItemStatus::Failed, None, None, None)
            .await
            .unwrap();
        queue::update_status(
            &db,
            ids[6],
            QueueItemStatus::HeldRateLimit,
            None,
            None,
            None,
        )
        .await
        .unwrap();

        let stats = queue::stats(&db).await.unwrap();

        assert_eq!(stats.pending, 3, "Should count 3 pending");
        assert_eq!(stats.sending, 2, "Should count 2 sending");
        assert_eq!(stats.sent, 2, "Should count 2 sent");
        assert_eq!(stats.failed, 2, "Should count 2 failed");
        assert_eq!(stats.held, 1, "Should count 1 held");
    }

    #[tokio::test]
    async fn test_stats_empty_queue() {
        let db = setup_test_db().await;

        let stats = queue::stats(&db).await.unwrap();

        assert_eq!(stats.pending, 0);
        assert_eq!(stats.sending, 0);
        assert_eq!(stats.sent, 0);
        assert_eq!(stats.failed, 0);
        assert_eq!(stats.held, 0);
    }

    // ──────────────────────────────────────────────────────────────────────
    // Data Integrity
    // ──────────────────────────────────────────────────────────────────────

    #[tokio::test]
    async fn test_queue_items_cascade_delete_with_campaign() {
        let db = setup_test_db().await;
        let (campaign, contacts) = create_test_campaign(&db, "Test Campaign", 3).await;
        create_queue_items(&db, &campaign, &contacts).await;

        // Verify items exist
        let items_before = queue::list_all(&db, Some(campaign.id)).await.unwrap();
        assert_eq!(items_before.len(), 3);

        // Delete campaign (should cascade to queue items via foreign key)
        sqlx::query!(
            "DELETE FROM campaigns WHERE id = ?",
            campaign.id.to_string()
        )
        .execute(db.pool())
        .await
        .unwrap();

        // Verify items are deleted
        let items_after = queue::list_all(&db, Some(campaign.id)).await.unwrap();
        assert_eq!(
            items_after.len(),
            0,
            "Queue items should cascade delete with campaign"
        );
    }

    #[tokio::test]
    async fn test_queue_item_preserves_campaign_title() {
        let db = setup_test_db().await;
        let (campaign, contacts) = create_test_campaign(&db, "Original Title", 1).await;
        let ids = create_queue_items(&db, &campaign, &contacts).await;

        // Update campaign title
        sqlx::query!(
            "UPDATE campaigns SET title = ? WHERE id = ?",
            "Updated Title",
            campaign.id.to_string()
        )
        .execute(db.pool())
        .await
        .unwrap();

        // Queue item should still have original denormalized title
        let item = queue::get_by_id(&db, ids[0]).await.unwrap();
        assert_eq!(
            item.campaign_title, "Original Title",
            "Denormalized campaign title should not change"
        );
    }
}
