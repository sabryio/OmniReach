/**
 * Mock Log Data
 * System activity logs
 */
import type { LogEntry } from "@/types";

export const MOCK_LOGS: LogEntry[] = [
  {
    id: "log001",
    timestamp: Date.now() - 60000,
    level: "info",
    message: "Message sent successfully to +201012345678",
    category: "send",
  },
  {
    id: "log002",
    timestamp: Date.now() - 120000,
    level: "warn",
    message: "Rate limit reached for session-001, message held",
    category: "rate_limit",
  },
  {
    id: "log003",
    timestamp: Date.now() - 180000,
    level: "info",
    message: "Campaign 'Monthly Prescription Refill Reminder' started",
    category: "send",
  },
  {
    id: "log004",
    timestamp: Date.now() - 240000,
    level: "error",
    message: "Failed to send message to +201023456789: Network timeout",
    category: "send",
  },
  {
    id: "log005",
    timestamp: Date.now() - 300000,
    level: "info",
    message: "Session 'Pharmacy Main Line' connected successfully",
    category: "session",
  },
];
