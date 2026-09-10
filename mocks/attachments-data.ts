import type { Attachment } from '@/types/domain'

/** Metadata-only mock store. File bytes will move to object storage with the backend. */
export const attachmentsData: Attachment[] = [
  { id: 'ATT-001', name: 'عقد إدارة برج الصيوان.pdf', category: 'عقد إدارة', uploadedAt: '2026-01-01', mimeType: 'application/pdf', size: 248000, relatedEntityType: 'management_contract', relatedEntityId: '1', uploadedBy: 'مدير النظام' },
  { id: 'ATT-002', name: 'عقد إيجار منصة إيجار.pdf', category: 'عقد إيجار', uploadedAt: '2026-01-02', mimeType: 'application/pdf', size: 186000, relatedEntityType: 'lease', relatedEntityId: '1', uploadedBy: 'مدير النظام' },
]
