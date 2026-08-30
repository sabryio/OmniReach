import type { MessageTemplate } from '@/types'

// Templates backend endpoints don't exist yet.
// Using hardcoded defaults until /api/templates/* is implemented.

const DEFAULT_TEMPLATES: MessageTemplate[] = [
  {
    id: 'tmpl_001',
    title: 'Prescription Ready for Pickup',
    category: 'Pharmacy',
    text: 'Hello {{name}}, your prescription for {{prescription}} is ready for pickup at our pharmacy. Please bring your ID.',
    imageUrl: 'https://images.unsplash.com/photo-1631815589968-fdb09a223b1e?auto=format&fit=crop&w=600&q=80',
    imageFileName: 'prescription_ready.jpg',
    suggestedVariables: ['name', 'prescription'],
    createdAt: Date.now() - 86400000 * 30,
    updatedAt: Date.now() - 86400000 * 30,
  },
  {
    id: 'tmpl_002',
    title: 'Lab Results Available',
    category: 'Lab Results',
    text: 'Dear {{name}}, your lab results are now available. Please visit us during business hours or log into the patient portal at {{portal_url}}.',
    imageUrl: 'https://images.unsplash.com/photo-1579154204601-01588f351e67?auto=format&fit=crop&w=600&q=80',
    imageFileName: 'lab_results.jpg',
    suggestedVariables: ['name', 'portal_url'],
    createdAt: Date.now() - 86400000 * 25,
    updatedAt: Date.now() - 86400000 * 25,
  },
  {
    id: 'tmpl_003',
    title: 'Flu Vaccine Reminder',
    category: 'Vaccination',
    text: 'Hi {{name}}, flu season is here! Protect yourself and your family with our flu vaccine. Book your appointment today at {{pharmacy}}.',
    imageUrl: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=600&q=80',
    imageFileName: 'flu_vaccine.jpg',
    suggestedVariables: ['name', 'pharmacy'],
    createdAt: Date.now() - 86400000 * 20,
    updatedAt: Date.now() - 86400000 * 20,
  },
  {
    id: 'tmpl_004',
    title: 'VIP Membership Benefits',
    category: 'VIP Care',
    text: 'Exclusive offer for {{name}}! As a VIP member, enjoy 20% off all purchases this month. Visit us at {{pharmacy}} to claim your rewards.',
    imageUrl: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&w=600&q=80',
    imageFileName: 'vip_benefits.jpg',
    suggestedVariables: ['name', 'pharmacy'],
    createdAt: Date.now() - 86400000 * 15,
    updatedAt: Date.now() - 86400000 * 15,
  },
  {
    id: 'tmpl_005',
    title: 'Refill Reminder',
    category: 'Refill Reminder',
    text: "Hello {{name}}, it's time to refill your {{prescription}}. Call us or order online for convenient pickup or delivery.",
    suggestedVariables: ['name', 'prescription'],
    createdAt: Date.now() - 86400000 * 10,
    updatedAt: Date.now() - 86400000 * 10,
  },
]

// ─── Queries ──────────────────────────────────────────────────────────────────

export async function getTemplates(): Promise<MessageTemplate[]> {
  // TODO: Phase 2 — await fetch(`${API_BASE_URL}/api/templates`)
  return DEFAULT_TEMPLATES
}

export async function getTemplate(id: string): Promise<MessageTemplate> {
  const t = DEFAULT_TEMPLATES.find((t) => t.id === id)
  if (!t) throw new Error(`Template ${id} not found`)
  return t
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export type CreateTemplateParams = Omit<MessageTemplate, 'id' | 'createdAt' | 'updatedAt'>

export async function createTemplate(params: CreateTemplateParams): Promise<MessageTemplate> {
  // TODO: Phase 2 — await fetch(`${API_BASE_URL}/api/templates`, { method: 'POST', ... })
  return {
    ...params,
    id: `tmpl_${Date.now()}`,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }
}

export async function updateTemplate(
  id: string,
  updates: Partial<MessageTemplate>,
): Promise<MessageTemplate> {
  // TODO: Phase 2 — await fetch(`${API_BASE_URL}/api/templates/${id}`, { method: 'PATCH', ... })
  const t = await getTemplate(id)
  return { ...t, ...updates, updatedAt: Date.now() }
}

export async function deleteTemplate(_id: string): Promise<void> {
  // TODO: Phase 2 — await fetch(`${API_BASE_URL}/api/templates/${id}`, { method: 'DELETE' })
  return
}
