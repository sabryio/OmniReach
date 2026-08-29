import { useState } from 'react'
import type { QueueItem, QueueItemStatus, LogEntry } from '@/types'

type LogLevel = 'all' | 'info' | 'warn' | 'error' | 'success'
type QueueFilter = QueueItemStatus | 'all'

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
    subTab, setSubTab,
    queueFilter, setQueueFilter,
    queueSearch, setQueueSearch,
    logFilter, setLogFilter,
    filteredQueue,
    filteredLogs,
  }
}
