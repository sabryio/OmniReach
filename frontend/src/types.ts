/**
 * OmniReach - Shared Type Definitions
 * Mirrors the mockup wabridge-broadcast-manager/src/types.ts
 */

export type ThemeMode = 'dark' | 'light' | 'system'
export type ThemeColor = 'blue' | 'emerald' | 'violet' | 'amber' | 'rose' | 'cyan'
export type Language = 'ar-EG' | 'en'

// ─── Contact ────────────────────────────────────────────────────────────────

export type ContactVerificationStatus =
  | 'unverified'
  | 'checking'
  | 'registered'
  | 'unregistered'
  | 'error'

export interface Contact {
  id: string
  rawPhone: string
  formattedPhone: string
  name: string
  customFields: Record<string, string>
  verificationStatus: ContactVerificationStatus
  verificationError?: string
  verifiedAt?: number
  waId?: string
}

// ─── Campaign ────────────────────────────────────────────────────────────────

export type CampaignStatus =
  | 'draft'
  | 'scheduled'
  | 'running'
  | 'paused'
  | 'completed'
  | 'cancelled'

export interface Campaign {
  id: string
  title: string
  templateText: string
  imageUrl?: string
  imageFileName?: string
  sessionIds: string[]
  status: CampaignStatus
  createdAt: number
  startedAt?: number
  completedAt?: number
  totalContacts: number
  verifiedContacts: number
  unregisteredCount: number
  sentCount: number
  skippedCount: number
  failedCount: number
  contacts: Contact[]
  isArchived?: boolean
  archivedAt?: number
}

// ─── Queue ───────────────────────────────────────────────────────────────────

export type QueueItemStatus =
  | 'pending'
  | 'verifying'
  | 'sending'
  | 'sent'
  | 'skipped_unregistered'
  | 'failed'
  | 'held_rate_limit'
  | 'held_time_window'
  | 'cancelled'

export interface QueueItem {
  id: string
  campaignId: string
  campaignTitle: string
  contactId: string
  phone: string
  recipientName?: string
  renderedText: string
  imageUrl?: string
  status: QueueItemStatus
  assignedSessionId?: string
  attempts: number
  lastError?: string
  sentAt?: number
  scheduledFor?: number
  rateLimitHoldUntil?: number
  timeWindowHoldUntil?: number
  responsePayload?: string
}

// ─── Session ─────────────────────────────────────────────────────────────────

export interface WABridgeSession {
  id: string
  name: string
  phoneNumber?: string
  status: 'connected' | 'disconnected' | 'qr_required' | 'connecting'
  hourlyLimit: number
  dailyLimit: number
  hourlySentTimestamps: number[]
  dailySentTimestamps: number[]
  qrCodeData?: string
  lastActivityAt?: number
}

export interface SessionRateQuota {
  sessionId: string
  sessionName: string
  hourlyUsed: number
  hourlyLimit: number
  hourlyRemaining: number
  dailyUsed: number
  dailyLimit: number
  dailyRemaining: number
  isHourlyCapped: boolean
  isDailyCapped: boolean
  canSend: boolean
  nextHourlySlotMs?: number
  nextDailySlotMs?: number
  reason?: string
}

// ─── Scheduler ───────────────────────────────────────────────────────────────

export interface SchedulerState {
  isRunning: boolean
  isWithinTimeWindow: boolean
  timeWindowText: string
  currentLocalTimeStr: string
  nextWindowOpenTimestamp?: number
  activeSendingCount: number
  totalQueuePending: number
  totalQueueHeld: number
  strictTimeWindow: boolean
  customWindowStartHour: number
  customWindowEndHour: number
  simulatedHourOffset: number
}

// ─── Config ──────────────────────────────────────────────────────────────────

export interface WABridgeConfig {
  baseUrl: string
  apiKey?: string
  timeoutMs: number
  useSimulationMode: boolean
  simulatedNetworkLatencyMs: number
  simulatedUnregisteredRate: number
}

// ─── Log ─────────────────────────────────────────────────────────────────────

export interface LogEntry {
  id: string
  timestamp: number
  level: 'info' | 'warn' | 'error' | 'success'
  category: 'verification' | 'send' | 'rate_limit' | 'scheduler' | 'session' | 'system'
  message: string
  details?: Record<string, unknown>
}

// ─── Template ────────────────────────────────────────────────────────────────

export interface MessageTemplate {
  id: string
  title: string
  titleAr?: string
  category: string
  categoryAr?: string
  text: string
  textAr?: string
  imageUrl?: string
  imageFileName?: string
  suggestedVariables: string[]
  createdAt?: number
  updatedAt?: number
}

// ─── CSV ─────────────────────────────────────────────────────────────────────

export interface CSVParseResult {
  fileName: string
  headers: string[]
  totalRows: number
  phoneColumn: string
  nameColumn?: string
  customColumns: string[]
}
