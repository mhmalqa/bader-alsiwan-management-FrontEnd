'use client'

import { useId } from 'react'
import { attachmentsData } from '@/mocks/attachments-data'
import type { Attachment } from '@/types/domain'
import { logAudit } from '@/services/frontend-store'

export interface LocalAttachment { id: string; name: string; size: number; category?: string }
type Props = { value: LocalAttachment[]; onChange: (items: LocalAttachment[]) => void; entityType?: string; entityId?: string; category?: string }

/**
 * Keeps attachment metadata in the shared Mock store. The browser File object is
 * intentionally not retained: the backend will replace this with object storage.
 */
export function AttachmentUploader({ value, onChange, entityType = 'draft', entityId = 'new', category = 'مرفق' }: Props) {
  const inputId = useId()
  const add = (files: File[]) => {
    const created: LocalAttachment[] = files.map((file) => {
      if (entityId === 'new' || entityId === 'draft') throw new Error('احفظ السجل أولاً، ثم أضف المرفق ليرتبط بسجل موثق.')
      const id = `ATT-${crypto.randomUUID()}`
      const record: Attachment = { id, name: file.name, category, uploadedAt: new Date().toISOString(), mimeType: file.type || 'application/octet-stream', size: file.size, relatedEntityType: entityType, relatedEntityId: entityId, uploadedBy: 'مدير النظام' }
      attachmentsData.push(record)
      logAudit('إرفاق', 'مرفق', id, `${file.name} مرتبط بـ ${entityType}/${entityId}`)
      return { id, name: file.name, size: file.size, category }
    })
    onChange([...value, ...created])
  }
  const remove = (id: string) => {
    const index = attachmentsData.findIndex((item) => item.id === id)
    if (index >= 0) attachmentsData.splice(index, 1)
    onChange(value.filter((entry) => entry.id !== id))
  }
  return <section className="attachment-uploader"><label htmlFor={inputId}>المرفقات</label><input id={inputId} type="file" multiple onChange={(event) => { add(Array.from(event.target.files ?? [])); event.currentTarget.value = '' }} /><small>يُحفظ وصف الملف ونطاقه في بيانات Mock الموحدة؛ وسيُرفع الملف الفعلي إلى خدمة التخزين عند ربط الخلفية.</small>{value.map((item) => <div className="attachment-item" key={item.id}><span>{item.name}</span><button type="button" onClick={() => remove(item.id)}>إزالة</button></div>)}</section>
}
