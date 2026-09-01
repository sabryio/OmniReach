/**
 * Time Window Validation
 * 
 * Determines if the current time falls within the configured sending window
 * (e.g., 9AM - 9PM for WhatsApp compliance).
 */

/**
 * Check if current time is within the allowed sending window.
 * 
 * @param nowMs - Current timestamp in milliseconds
 * @param startHour - Window start hour (0-23, e.g., 9 for 9AM)
 * @param endHour - Window end hour (0-23, e.g., 21 for 9PM)
 * @param simulatedOffset - Simulated hour offset for testing (default: 0)
 * @returns true if within window, false otherwise
 */
export function isWithinTimeWindow(
  nowMs: number,
  startHour: number,
  endHour: number,
  simulatedOffset: number = 0
): boolean {
  const date = new Date(nowMs);
  const currentHour = date.getHours() + simulatedOffset;

  // Normalize hour to 0-23 range (handle overflow from simulation)
  const normalizedHour = ((currentHour % 24) + 24) % 24;

  // Handle overnight windows (e.g., 22:00 - 06:00)
  if (startHour <= endHour) {
    // Normal day window (e.g., 9:00 - 21:00)
    return normalizedHour >= startHour && normalizedHour < endHour;
  } else {
    // Overnight window (e.g., 22:00 - 06:00)
    return normalizedHour >= startHour || normalizedHour < endHour;
  }
}

/**
 * Calculate milliseconds until the next window opens.
 * Returns null if currently within window.
 * 
 * @param nowMs - Current timestamp in milliseconds
 * @param startHour - Window start hour (0-23)
 * @param endHour - Window end hour (0-23)
 * @param simulatedOffset - Simulated hour offset for testing (default: 0)
 * @returns Milliseconds until window opens, or null if already open
 */
export function msUntilNextWindow(
  nowMs: number,
  startHour: number,
  endHour: number,
  simulatedOffset: number = 0
): number | null {
  if (isWithinTimeWindow(nowMs, startHour, endHour, simulatedOffset)) {
    return null;
  }

  const date = new Date(nowMs);
  const currentHour = date.getHours() + simulatedOffset;
  const normalizedHour = ((currentHour % 24) + 24) % 24;

  let hoursUntilOpen: number;

  if (startHour <= endHour) {
    // Normal day window
    if (normalizedHour < startHour) {
      hoursUntilOpen = startHour - normalizedHour;
    } else {
      // After window closed, wait until tomorrow
      hoursUntilOpen = (24 - normalizedHour) + startHour;
    }
  } else {
    // Overnight window
    if (normalizedHour >= endHour && normalizedHour < startHour) {
      hoursUntilOpen = startHour - normalizedHour;
    } else {
      // Should not reach here if isWithinTimeWindow is correct
      hoursUntilOpen = 0;
    }
  }

  const minutesUntilOpen = hoursUntilOpen * 60 - date.getMinutes();
  const secondsUntilOpen = minutesUntilOpen * 60 - date.getSeconds();
  
  return secondsUntilOpen * 1000;
}
