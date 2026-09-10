'use client'

import { Download, Printer } from 'lucide-react'
import { useState } from 'react'
import { AppDialog } from '@/components/shared/app-dialog'
import { leases, properties, tenants, units } from '@/mocks/data'
import { collectionFollowUps, generatedDocuments } from '@/mocks/operations-data'
import { logAudit } from '@/services/frontend-store'
import type { Receivable } from '@/types/domain'

const money = (value: number) => new Intl.NumberFormat('ar-SA', { style: 'currency', currency: 'SAR', maximumFractionDigits: 0 }).format(value)
const escapeHtml = (value: string) => value.replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' })[character] ?? character)

function template(item: Receivable) {
  const tenant = tenants.find((record) => record.id === item.tenantId)
  const property = properties.find((record) => record.id === item.propertyId)
  const unit = units.find((record) => record.id === item.unitId)
  const lease = leases.find((record) => record.id === item.leaseId)
  return `التاريخ: ${new Intl.DateTimeFormat('ar-SA', { dateStyle: 'long' }).format(new Date())}\n\nالسادة/ ${tenant?.fullName ?? 'المستأجر'} المحترمون،\n\nالموضوع: مطالبة بسداد دفعة إيجارية مستحقة\n\nنفيدكم بوجود مبلغ مستحق قدره ${money(item.remainingAmount)} عن القسط رقم ${item.installmentNumber}، وتاريخ استحقاقه ${item.dueDate}.\n\nبيانات العقد والعقار:\nالعقار: ${property?.propertyName ?? '—'}\nالوحدة: ${unit?.unitNameOrNumber ?? '—'}\nرقم العقد: ${lease?.internalContractNumber ?? '—'}\n\nنأمل منكم سداد المبلغ في أقرب وقت، والتواصل مع إدارة الأملاك عند وجود أي استفسار.\n\nوتفضلوا بقبول فائق الاحترام،\nشركة بدر الصيوان للعقارات\nإدارة الأملاك والتحصيل`
}

export function DemandLetterDialog({ receivable, onClose }: { receivable: Receivable | null; onClose: () => void }) {
  const [edited, setEdited] = useState<{ id: string; text: string } | null>(null)
  const text = receivable ? edited?.id === receivable.id ? edited.text : template(receivable) : ''
  const setText = (next: string) => { if (receivable) setEdited({ id: receivable.id, text: next }) }
  const persistDraft = () => {
    if (!receivable || receivable.remainingAmount <= 0) return
    const existing = collectionFollowUps.find((item) => item.receivableId === receivable.id && item.status === 'draft' && item.renderedBody === text)
    if (existing) return existing
    const documentId = crypto.randomUUID()
    generatedDocuments.push({ id: documentId, templateId: 'payment-demand-v1', relatedEntityType: 'receivable', relatedEntityId: receivable.id, fileName: `خطاب-مطالبة-${receivable.id}.docx`, generatedAt: new Date().toISOString(), status: 'generated' })
    const followUp = { id: crypto.randomUUID(), receivableId: receivable.id, tenantId: receivable.tenantId, templateKey: 'payment_demand' as const, channel: 'manual' as const, scheduledAt: new Date().toISOString(), status: 'draft' as const, renderedBody: text, createdAt: new Date().toISOString(), createdBy: 'مدير النظام' }
    collectionFollowUps.push(followUp); logAudit('توليد', 'خطاب مطالبة', followUp.id, `حُفظت مسودة خطاب للاستحقاق ${receivable.id}`)
    return followUp
  }
  const print = () => { if (!receivable) return; const popup = window.open('', '_blank', 'noopener,noreferrer'); if (!popup) return; popup.document.write(`<!doctype html><html dir="rtl" lang="ar"><head><meta charset="utf-8"><title>خطاب مطالبة</title><style>body{font-family:Tahoma,Arial,sans-serif;direction:rtl;padding:46px;color:#183d2a;line-height:2}header{border-bottom:3px solid #178553;padding-bottom:18px;margin-bottom:28px}h1{font-size:23px;margin:0}pre{white-space:pre-wrap;font:inherit;line-height:2.15}</style></head><body><header><h1>شركة بدر الصيوان للعقارات</h1><span>إدارة الأملاك والتحصيل</span></header><pre>${escapeHtml(text)}</pre></body></html>`); popup.document.close(); popup.focus(); popup.print() }
  const download = () => { if (!receivable) return; persistDraft(); const blob = new Blob([`<!doctype html><html dir="rtl" lang="ar"><meta charset="utf-8"><body style="font-family:Tahoma,Arial;direction:rtl;line-height:2"><h2>شركة بدر الصيوان للعقارات</h2><p>إدارة الأملاك والتحصيل</p><hr><div style="white-space:pre-wrap">${escapeHtml(text)}</div></body></html>`], { type: 'application/msword;charset=utf-8' }); const url = URL.createObjectURL(blob); const anchor = document.createElement('a'); anchor.href = url; anchor.download = `خطاب-مطالبة-${tenants.find((item) => item.id === receivable.tenantId)?.fullName ?? receivable.id}.doc`; anchor.click(); URL.revokeObjectURL(url) }
  const reset = () => { if (receivable) setEdited({ id: receivable.id, text: template(receivable) }) }
  return <AppDialog open={Boolean(receivable)} onClose={onClose} title="توليد خطاب مطالبة بالسداد" description={receivable ? `${tenants.find((item) => item.id === receivable.tenantId)?.fullName ?? '—'} · ${properties.find((item) => item.id === receivable.propertyId)?.propertyName ?? '—'}` : ''}><div className="demand-letter-editor"><div className="demand-letter-editor__meta"><span>خطاب رسمي قابل للتعديل</span><b>القسط {receivable?.installmentNumber} · {receivable && money(receivable.remainingAmount)}</b></div><label><span>نص الخطاب</span><textarea value={text} onChange={(event) => setText(event.target.value)} rows={16} /></label><div className="demand-letter-editor__actions"><button className="cancel-button" type="button" onClick={reset}>استعادة النص المقترح</button><button className="icon-action" type="button" onClick={print}><Printer size={16} /> طباعة / PDF</button><button className="add-button" type="button" onClick={download}><Download size={16} /> تنزيل Word</button></div></div></AppDialog>
}
