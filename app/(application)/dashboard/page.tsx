'use client'

import Link from 'next/link'
import { Download, FileText, Printer, Send, SlidersHorizontal, TriangleAlert } from 'lucide-react'
import { useMemo, useState } from 'react'
import { AppDialog } from '@/components/shared/app-dialog'
import { leases, payments, properties, receivables, settlements, tenants, units } from '@/mocks/data'

const money = (value: number) => new Intl.NumberFormat('ar-SA', { style: 'currency', currency: 'SAR', maximumFractionDigits: 0 }).format(value)
const date = () => new Date().toISOString().slice(0, 10)
const daysUntil = (value: string) => Math.ceil((new Date(`${value}T00:00:00`).getTime() - new Date(`${date()}T00:00:00`).getTime()) / 86400000)
const tenantName = (id: string) => tenants.find((item) => item.id === id)?.fullName ?? '—'
const propertyName = (id: string) => properties.find((item) => item.id === id)?.propertyName ?? '—'
const unitName = (id: string) => units.find((item) => item.id === id)?.unitNameOrNumber ?? '—'
const escapeHtml = (value: string) => value.replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' })[character] ?? character)

export default function DashboardPage() {
  const [reminderDays, setReminderDays] = useState(10)
  const [queue, setQueue] = useState<'overdue' | 'upcoming' | null>(null)
  const [selected, setSelectedRaw] = useState<(typeof receivables)[number] | null>(null)
  const [letter, setLetter] = useState('')
  const due = useMemo(() => receivables.filter((item) => item.remainingAmount > 0), [])
  const overdue = due.filter((item) => daysUntil(item.dueDate) < 0)
  const upcoming = due.filter((item) => { const days = daysUntil(item.dueDate); return days >= 0 && days <= reminderDays })
  const queueItems = queue === 'overdue' ? overdue : upcoming
  const collected = payments.filter((item) => item.status === 'confirmed').reduce((sum, item) => sum + item.amount, 0)
  const outstanding = due.reduce((sum, item) => sum + item.remainingAmount, 0)
  const buildLetter = (item: (typeof receivables)[number]) => {
    const lease = leases.find((contract) => contract.id === item.leaseId)
    return `التاريخ: ${new Intl.DateTimeFormat('ar-SA', { dateStyle: 'long' }).format(new Date())}\n\nالسادة/ ${tenantName(item.tenantId)} المحترمون،\n\nالموضوع: مطالبة بسداد دفعة إيجارية مستحقة\n\nنفيدكم بوجود مبلغ مستحق قدره ${money(item.remainingAmount)} عن القسط رقم ${item.installmentNumber}، وتاريخ استحقاقه ${item.dueDate}.\n\nبيانات العقد والعقار:\nالعقار: ${propertyName(item.propertyId)}\nالوحدة: ${unitName(item.unitId)}\nرقم العقد: ${lease?.internalContractNumber ?? '—'}\n\nنأمل منكم سداد المبلغ في أقرب وقت، والتواصل مع إدارة الأملاك عند وجود أي استفسار.\n\nوتفضلوا بقبول فائق الاحترام،\nشركة بدر الصيوان للعقارات\nإدارة الأملاك والتحصيل`
  }
  const setSelected = (item: (typeof receivables)[number] | null) => { if (item) setLetter(buildLetter(item)); setSelectedRaw(item) }
  const printLetter = () => {
    if (!selected) return
    const popup = window.open('', '_blank', 'noopener,noreferrer')
    if (!popup) return
    popup.document.write(`<!doctype html><html dir="rtl" lang="ar"><head><meta charset="utf-8"><title>خطاب مطالبة ${escapeHtml(tenantName(selected.tenantId))}</title><style>body{font-family:Tahoma,Arial,sans-serif;direction:rtl;padding:46px;color:#183d2a;line-height:2}header{border-bottom:3px solid #178553;padding-bottom:18px;margin-bottom:28px}h1{font-size:23px;margin:0}pre{white-space:pre-wrap;font:inherit;line-height:2.15}</style></head><body><header><h1>شركة بدر الصيوان للعقارات</h1><span>إدارة الأملاك والتحصيل</span></header><pre>${escapeHtml(letter)}</pre></body></html>`)
    popup.document.close(); popup.focus(); popup.print()
  }
  const downloadLetter = () => {
    if (!selected) return
    const content = `<!doctype html><html dir="rtl" lang="ar"><meta charset="utf-8"><body style="font-family:Tahoma,Arial;direction:rtl;line-height:2"><h2>شركة بدر الصيوان للعقارات</h2><p>إدارة الأملاك والتحصيل</p><hr><div style="white-space:pre-wrap">${escapeHtml(letter)}</div></body></html>`
    const url = URL.createObjectURL(new Blob([content], { type: 'application/msword;charset=utf-8' }))
    const anchor = document.createElement('a'); anchor.href = url; anchor.download = `خطاب-مطالبة-${tenantName(selected.tenantId)}.doc`; anchor.click(); URL.revokeObjectURL(url)
  }
  return <div className="content collection-dashboard" dir="rtl"><div className="module-title"><div><span className="overline">لوحة التحكم</span><h1>متابعة التحصيل</h1><p>الأولوية اليوم: الأقساط المتأخرة والاستحقاقات القريبة التي تحتاج خطاب مطالبة.</p></div><Link href="/receivables" className="add-button">إدارة جميع الاستحقاقات</Link></div><section className="collection-settings"><div><SlidersHorizontal size={18} /><div><b>نافذة التنبيه للاستحقاقات القادمة</b><span>أظهر الأقساط التي يلزم متابعتها قبل موعدها</span></div></div><label><span>قبل</span><input type="number" min="1" max="90" value={reminderDays} onChange={(event) => setReminderDays(Math.max(1, Number(event.target.value) || 1))} /><span>أيام</span></label></section><div className="collection-kpis"><button className={`collection-kpi overdue ${queue === 'overdue' ? 'active' : ''}`} onClick={() => setQueue('overdue')}><TriangleAlert size={20} /><span>دفعات متأخرة</span><strong>{overdue.length}</strong><small>{money(overdue.reduce((sum, item) => sum + item.remainingAmount, 0))} تحتاج تحصيل</small><em>عرض المستأجرين ←</em></button><button className={`collection-kpi upcoming ${queue === 'upcoming' ? 'active' : ''}`} onClick={() => setQueue('upcoming')}><Send size={20} /><span>دفعات خلال {reminderDays} أيام</span><strong>{upcoming.length}</strong><small>{money(upcoming.reduce((sum, item) => sum + item.remainingAmount, 0))} تحتاج تذكيراً</small><em>تجهيز الخطابات ←</em></button><article className="collection-kpi"><FileText size={20} /><span>الرصيد المتبقي</span><strong>{money(outstanding)}</strong><small>جميع الأقساط غير المسددة</small></article><article className="collection-kpi"><FileText size={20} /><span>محصلات مؤكدة</span><strong>{money(collected)}</strong><small>من الدفعات المسجلة</small></article></div>{queue && <section className="collection-queue"><header><div><span className={queue === 'overdue' ? 'danger-label' : 'upcoming-label'}>{queue === 'overdue' ? 'تحصيل عاجل' : 'متابعة استباقية'}</span><h2>{queue === 'overdue' ? 'المستأجرون المتأخرون عن السداد' : `استحقاقات تحتاج متابعة خلال ${reminderDays} أيام`}</h2><p>اختر السجل لتجهيز خطاب رسمي قابل للتعديل قبل التنزيل أو الطباعة.</p></div><button className="cancel-button" onClick={() => setQueue(null)}>إخفاء القائمة</button></header><div className="collection-queue__list">{queueItems.map((item) => <article key={item.id}><div className="collection-person"><b>{tenantName(item.tenantId)}</b><span>{propertyName(item.propertyId)} · {unitName(item.unitId)} · {tenants.find((tenant) => tenant.id === item.tenantId)?.mobilePrimary ?? '—'}</span></div><div><small>الاستحقاق</small><b>{item.dueDate}</b></div><div><small>{queue === 'overdue' ? 'أيام التأخير' : 'متبقي'}</small><b>{Math.abs(daysUntil(item.dueDate))} يوم</b></div><div><small>المبلغ</small><b>{money(item.remainingAmount)}</b></div><button className="collection-letter-action" onClick={() => setSelected(item)}><FileText size={16} /> توليد خطاب</button></article>)}{!queueItems.length && <div className="collection-queue__empty">لا توجد دفعات ضمن هذا النطاق حالياً.</div>}</div></section>}<section className="card financial-flow"><h2>الملخص المالي</h2><div className="financial-grid"><span>المحصلات <b>{money(collected)}</b></span><span>صافي المستحق <b>{money(settlements.reduce((sum, item) => sum + item.netDueToOwner, 0))}</b></span><span>المحوّل للملاك <b>{money(settlements.reduce((sum, item) => sum + item.transferAmount, 0))}</b></span><span>المتبقي للملاك <b>{money(settlements.reduce((sum, item) => sum + item.remainingBalance, 0))}</b></span></div></section><AppDialog open={Boolean(selected)} onClose={() => setSelected(null)} title="توليد خطاب مطالبة بالسداد" description={selected ? `${tenantName(selected.tenantId)} · ${propertyName(selected.propertyId)} · ${unitName(selected.unitId)}` : ''}><div className="demand-letter-editor"><div className="demand-letter-editor__meta"><span>خطاب رسمي قابل للتعديل</span><b>القسط {selected?.installmentNumber} · {selected && money(selected.remainingAmount)}</b></div><label><span>نص الخطاب</span><textarea value={letter} onChange={(event) => setLetter(event.target.value)} rows={16} /></label><div className="demand-letter-editor__actions"><button className="cancel-button" onClick={() => selected && setLetter(buildLetter(selected))}>استعادة النص المقترح</button><button className="icon-action" onClick={printLetter}><Printer size={16} /> طباعة / PDF</button><button className="add-button" onClick={downloadLetter}><Download size={16} /> تنزيل Word</button></div></div></AppDialog></div>
}
