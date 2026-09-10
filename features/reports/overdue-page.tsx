'use client'

import { FileText, Printer } from 'lucide-react'
import { useMemo, useState } from 'react'
import { DemandLetterDialog } from '@/components/shared/demand-letter-dialog'
import { properties, receivables, tenants, units } from '@/mocks/data'

const today = () => new Date().toISOString().slice(0, 10)
const money = (value: number) => `${new Intl.NumberFormat('ar-SA').format(value)} ر.س`
const daysLate = (dueDate: string) => Math.max(0, Math.ceil((new Date(`${today()}T00:00:00`).getTime() - new Date(`${dueDate}T00:00:00`).getTime()) / 86400000))

export function OverdueReportPage() {
  const [propertyId, setPropertyId] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [letterTarget, setLetterTarget] = useState<(typeof receivables)[number] | null>(null)
  const items = useMemo(() => receivables.filter((item) => item.remainingAmount > 0 && item.dueDate < today() && (!propertyId || item.propertyId === propertyId) && (!from || item.dueDate >= from) && (!to || item.dueDate <= to)), [propertyId, from, to])
  const total = items.reduce((sum, item) => sum + item.remainingAmount, 0)
  return <div className="content reports-page" dir="rtl"><div className="module-title"><div><span className="overline">تحصيل عاجل</span><h1>تقرير المتأخرات</h1><p>راجع الأقساط المتأخرة، ثم أنشئ خطاب مطالبة مخصصاً لكل مستأجر مباشرة من نفس السجل.</p></div><button className="icon-action" onClick={() => window.print()}><Printer size={17} /> طباعة القائمة</button></div><section className="card report-panel"><div className="report-filters report-filters--context"><label className="report-entity-field"><span>العقار</span><select value={propertyId} onChange={(event) => setPropertyId(event.target.value)}><option value="">جميع العقارات</option>{properties.map((property) => <option key={property.id} value={property.id}>{property.propertyName}</option>)}</select></label><label><span>من تاريخ</span><input type="date" value={from} onChange={(event) => setFrom(event.target.value)} /></label><label><span>إلى تاريخ</span><input type="date" min={from || undefined} value={to} onChange={(event) => setTo(event.target.value)} /></label></div><div className="report-metrics"><div><span>إجمالي المتأخرات</span><b>{money(total)}</b></div><div><span>الأقساط المتأخرة</span><b>{items.length}</b></div><div><span>المستأجرون المتأخرون</span><b>{new Set(items.map((item) => item.tenantId)).size}</b></div></div><div className="report-results"><div className="report-results__heading"><div><h2>قائمة المتابعة والمطالبات</h2><p>توليد الخطاب لا يرسله تلقائياً؛ يمكنك مراجعته وتعديله وتنزيله أو طباعته.</p></div><span>{items.length} سجل</span></div><div className="table-wrap"><table><thead><tr><th>المستأجر</th><th>العقار والوحدة</th><th>الاستحقاق</th><th>أيام التأخير</th><th>المبلغ المتبقي</th><th>الإجراء</th></tr></thead><tbody>{items.map((item) => <tr key={item.id}><td><b>{tenants.find((tenant) => tenant.id === item.tenantId)?.fullName ?? '—'}</b><small className="report-contact">{tenants.find((tenant) => tenant.id === item.tenantId)?.mobilePrimary ?? '—'}</small></td><td>{properties.find((property) => property.id === item.propertyId)?.propertyName} · {units.find((unit) => unit.id === item.unitId)?.unitNameOrNumber}</td><td>القسط {item.installmentNumber} · {item.dueDate}</td><td><span className="overdue-days">{daysLate(item.dueDate)} يوم</span></td><td><b>{money(item.remainingAmount)}</b></td><td><button className="report-letter-action" onClick={() => setLetterTarget(item)}><FileText size={16} /> توليد خطاب</button></td></tr>)}{!items.length && <tr><td colSpan={6}>لا توجد أقساط متأخرة ضمن المعايير المختارة.</td></tr>}</tbody></table></div></div></section><DemandLetterDialog receivable={letterTarget} onClose={() => setLetterTarget(null)} /></div>
}
