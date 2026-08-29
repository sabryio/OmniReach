import { useCallback } from 'react'
import type { Campaign, QueueItem } from '@/types'

export function useReports(campaigns: Campaign[], queue: QueueItem[]) {
  const totalAudience = campaigns.reduce((a, c) => a + c.totalContacts, 0)
  const totalDelivered = campaigns.reduce((a, c) => a + c.sentCount, 0)
  const totalUnregistered = campaigns.reduce((a, c) => a + c.unregisteredCount, 0)
  const deliveryRate = totalAudience > 0 ? Math.round((totalDelivered / totalAudience) * 100) : 0
  const unregisteredRate = totalAudience > 0 ? Math.round((totalUnregistered / totalAudience) * 100) : 0

  const today = new Date().setHours(0, 0, 0, 0)
  const sentToday = queue.filter(
    (q) => q.status === 'sent' && q.sentAt && q.sentAt >= today,
  ).length

  const exportCampaignCsv = useCallback((campaign: Campaign) => {
    const rows = [
      ['Name', 'Phone', 'WA Status', 'waId'],
      ...(campaign.contacts ?? []).map((c) => [c.name, c.rawPhone, c.verificationStatus, c.waId ?? '']),
    ]
    const csv = rows.map((r) => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${campaign.id}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }, [])

  const exportFullCsv = useCallback(() => {
    const rows = [
      ['CampaignId', 'CampaignTitle', 'Phone', 'Recipient', 'Status', 'SentAt', 'ComplianceRuleHonored'],
      ...queue.map((q) => [
        q.campaignId,
        q.campaignTitle,
        q.phone,
        q.recipientName ?? '',
        q.status,
        q.sentAt ? new Date(q.sentAt).toISOString() : '',
        'true',
      ]),
    ]
    const csv = rows.map((r) => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `omnireach-audit-${Date.now()}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }, [queue])

  return {
    totals: { audience: totalAudience, delivered: totalDelivered, unregistered: totalUnregistered, deliveryRate, unregisteredRate, sentToday },
    exportCampaignCsv,
    exportFullCsv,
  }
}
