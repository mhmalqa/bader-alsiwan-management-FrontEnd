'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { getLease, type LeaseDetail } from './api'

const frequencyLabel: Record<string, string> = { annual: 'سنوي', semi_annual: 'نصف سنوي', quarterly: 'ربع سنوي', monthly: 'شهري', one_time: 'دفعة واحدة', custom: 'مخصص' }
const money = (amount: number) => `${new Intl.NumberFormat('ar-SA').format(amount)} ر.س`

export function LeaseDetailsPage({ id }: { id: string }) {
  const [lease, setLease] = useState<LeaseDetail>(); const [error, setError] = useState('')
  useEffect(() => { const timer = setTimeout(() => void getLease(id).then(setLease).catch(error => setError(error instanceof Error ? error.message : 'تعذر تحميل عقد الإيجار.')), 0); return () => clearTimeout(timer) }, [id])
  if (error) return <div className="content"><p className="error-message">{error}</p></div>
  if (!lease) return <div className="content"><p>جارٍ تحميل عقد الإيجار…</p></div>
  return <div className="content"><div className="module-title"><div><span className="overline">عقد إيجار</span><h1>{lease.internalNumber}</h1><p>{lease.spaces.map(space => `${space.propertyName} · ${space.spaceName}`).join('، ') || 'لا توجد مساحات مرتبطة'}</p></div><Link className="add-button" href={`/leases/${id}/edit`}>تعديل العقد</Link></div><section className="card"><h2>بيانات العقد</h2><div className="financial-grid"><span>البداية <b>{lease.startDate}</b></span><span>النهاية <b>{lease.endDate}</b></span><span>قيمة العقد <b>{money(lease.totalValue)}</b></span><span>دورية السداد <b>{frequencyLabel[lease.frequency] ?? lease.frequency}</b></span><span>الحالة <b>{lease.status}</b></span></div></section><section className="card table-card"><h2>المساحات المؤجرة</h2><div className="table-wrap"><table><thead><tr><th>العقار</th><th>المساحة</th><th>من</th><th>إلى</th></tr></thead><tbody>{lease.spaces.map(space => <tr key={space.spaceId}><td>{space.propertyName}</td><td>{space.spaceName}</td><td>{space.startDate}</td><td>{space.endDate}</td></tr>)}</tbody></table></div></section><section className="card table-card"><h2>جدول الأقساط</h2><div className="table-wrap"><table><thead><tr><th>القسط</th><th>تاريخ الاستحقاق</th><th>المبلغ</th><th>ملاحظات</th></tr></thead><tbody>{lease.installments.map(item => <tr key={item.id}><td>{item.sequenceNo}</td><td>{item.dueDate}</td><td>{money(item.amount)}</td><td>{item.notes ?? '—'}</td></tr>)}</tbody></table></div></section></div>
}
