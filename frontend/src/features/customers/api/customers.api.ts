import type { Contact } from '@/types'

// Customers are aggregated from campaigns — no dedicated mock file yet.
// The real source of truth will be GET /api/contacts when backend is ready.

// ─── Queries ──────────────────────────────────────────────────────────────────

export async function getContacts(): Promise<Contact[]> {
  // TODO: Phase 2 — await fetch(`${API_BASE_URL}/api/contacts`)
  return []
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export type CreateContactParams = {
  name: string
  rawPhone: string
  customFields?: Record<string, string>
}

export async function createContact(params: CreateContactParams): Promise<Contact> {
  // TODO: Phase 2 — await fetch(`${API_BASE_URL}/api/contacts`, { method: 'POST', ... })
  const clean = params.rawPhone.replace(/\D/g, '')
  const newContact: Contact = {
    id: `cust_${Date.now()}`,
    name: params.name,
    rawPhone: params.rawPhone,
    formattedPhone: clean,
    normalizedPhone: `+${clean}`,
    customFields: params.customFields ?? {},
    verificationStatus: 'unverified',
  }
  return newContact
}

export async function deleteContact(_id: string): Promise<void> {
  // TODO: Phase 2 — await fetch(`${API_BASE_URL}/api/contacts/${id}`, { method: 'DELETE' })
  return
}

export type VerifyContactParams = {
  phone: string
  sessionId: string
}

export async function verifyContact(
  params: VerifyContactParams,
): Promise<{ registered: boolean; waId?: string }> {
  // TODO: Phase 2 — await fetch(`${API_BASE_URL}/api/contacts/verify`, { method: 'POST', ... })
  await new Promise((r) => setTimeout(r, 800))
  const registered = Math.random() > 0.2
  return {
    registered,
    waId: registered ? `${params.phone.replace(/\D/g, '')}@s.whatsapp.net` : undefined,
  }
}
