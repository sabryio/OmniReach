/**
 * Mock WABridge Session Data
 * Realistic WhatsApp Business API sessions
 */
import type { WABridgeSession } from "@/types";

export const MOCK_SESSIONS: WABridgeSession[] = [
  {
    id: "session-001",
    name: "Pharmacy Main Line",
    phoneNumber: "+201012345001",
    status: "connected",
    hourlyLimit: 100,
    dailyLimit: 1000,
    hourlySentTimestamps: [
      Date.now() - 300000,
      Date.now() - 600000,
      Date.now() - 900000,
      Date.now() - 1200000,
      Date.now() - 1500000,
    ],
    dailySentTimestamps: Array.from({ length: 245 }, (_, i) => Date.now() - i * 300000),
  },
  {
    id: "session-002",
    name: "Customer Support",
    phoneNumber: "+201012345002",
    status: "connected",
    hourlyLimit: 80,
    dailyLimit: 800,
    hourlySentTimestamps: [
      Date.now() - 400000,
      Date.now() - 800000,
      Date.now() - 1200000,
    ],
    dailySentTimestamps: Array.from({ length: 156 }, (_, i) => Date.now() - i * 400000),
  },
  {
    id: "session-003",
    name: "Appointments",
    phoneNumber: "+201012345003",
    status: "connected",
    hourlyLimit: 60,
    dailyLimit: 600,
    hourlySentTimestamps: [Date.now() - 500000, Date.now() - 1000000],
    dailySentTimestamps: Array.from({ length: 89 }, (_, i) => Date.now() - i * 500000),
  },
];
