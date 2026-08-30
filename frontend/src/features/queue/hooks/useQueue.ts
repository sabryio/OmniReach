import { useState, useMemo } from 'react'
import type { QueueItem, QueueItemStatus, LogEntry } from '@/types'

type LogLevel = 'all' | 'info' | 'warn' | 'error' | 'success'
type QueueFilter = QueueItemStatus | 'all'
type SubTab = 'queue' | 'events' | 'analytics' | 'logs'

/**
 * Comprehensive hook for QueueAndLogsView
 * Manages all state: tabs, filters, search, counts, payload inspector
 */
export function useQueueAndLogs(queue: QueueItem[], logs: LogEntry[]) {
  // Tab state
  const [activeTab, setActiveTab] = useState<SubTab>('queue')

  // Queue tab state
  const [queueFilter, setQueueFilter] = useState<string>('all')
  const [queueSearch, setQueueSearch] = useState<string>('')
  const [selectedPayload, setSelectedPayload] = useState<{ title: string; json: string } | null>(null)

  // Logs/Events tab state
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [logSearch, setLogSearch] = useState<string>('')
  const [selectedLogDetail, setSelectedLogDetail] = useState<LogEntry | null>(null)

  // Computed queue counts (single source of truth)
  const queueCounts = useMemo(() => {
    const pendingCount = queue.filter(
      (q) => q.status === 'pending' || q.status === 'sending' || q.status === 'verifying'
    ).length
    const heldCount = queue.filter(
      (q) => q.status === 'held_rate_limit' || q.status === 'held_time_window'
    ).length
    const sentCount = queue.filter((q) => q.status === 'sent').length

    return { pendingCount, heldCount, sentCount }
  }, [queue])

  // Filtered queue items
  const filteredQueue = useMemo(() => {
    return queue.filter((item) => {
      if (queueFilter !== 'all' && item.status !== queueFilter) return false
      if (queueSearch) {
        const q = queueSearch.toLowerCase()
        return (
          item.phone.includes(q) ||
          (item.recipientName && item.recipientName.toLowerCase().includes(q)) ||
          item.campaignTitle.toLowerCase().includes(q) ||
          item.renderedText.toLowerCase().includes(q)
        )
      }
      return true
    })
  }, [queue, queueFilter, queueSearch])

  // Filtered logs
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      if (categoryFilter !== 'all' && log.category !== categoryFilter) return false
      if (logSearch) {
        const q = logSearch.toLowerCase()
        return (
          log.message.toLowerCase().includes(q) ||
          log.category.toLowerCase().includes(q) ||
          (log.details && JSON.stringify(log.details).toLowerCase().includes(q))
        )
      }
      return true
    })
  }, [logs, categoryFilter, logSearch])

  // Event stream logs (exclude system logs)
  const eventStreamLogs = useMemo(() => {
    return logs.filter((l) => l.category !== 'system')
  }, [logs])

  // Count helper for queue filter buttons
  const getQueueCountFor = (filterId: string) => {
    return filterId === 'all' ? queue.length : queue.filter((q) => q.status === filterId).length
  }

  return {
    // Tab control
    activeTab,
    setActiveTab,

    // Queue counts (for stats bar)
    queueCounts,

    // Queue tab
    queueFilter,
    setQueueFilter,
    queueSearch,
    setQueueSearch,
    filteredQueue,
    selectedPayload,
    setSelectedPayload,
    getQueueCountFor,

    // Logs/Events tabs
    categoryFilter,
    setCategoryFilter,
    logSearch,
    setLogSearch,
    filteredLogs,
    eventStreamLogs,
    selectedLogDetail,
    setSelectedLogDetail,
  }
}

/**
 * Legacy hook for backward compatibility
 * @deprecated Use useQueueAndLogs instead
 */
export function useQueue(queue: QueueItem[], logs: LogEntry[]) {
  const [subTab, setSubTab] = useState<'queue' | 'events' | 'analytics' | 'logs'>('queue')
  const [queueFilter, setQueueFilter] = useState<QueueFilter>('all')
  const [queueSearch, setQueueSearch] = useState('')
  const [logFilter, setLogFilter] = useState<LogLevel>('all')

  const filteredQueue = queue.filter((q) => {
    if (queueFilter !== 'all' && q.status !== queueFilter) return false
    if (queueSearch && !q.phone.includes(queueSearch) && !(q.recipientName ?? '').toLowerCase().includes(queueSearch.toLowerCase())) return false
    return true
  })

  const filteredLogs = logs.filter((l) => logFilter === 'all' || l.level === logFilter)

  return {
    subTab,
    setSubTab,
    queueFilter,
    setQueueFilter,
    queueSearch,
    setQueueSearch,
    logFilter,
    setLogFilter,
    filteredQueue,
    filteredLogs,
  }
}
