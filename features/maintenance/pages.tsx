'use client'

import Link from 'next/link'
import { Check, X } from 'lucide-react'
import { useState } from 'react'
import { EmptyState, ErrorState, LoadingState } from '@/components/shared/page-state'
import { maintenanceRepository } from '@/features/core/api/mock-repositories'
import { maintenanceRequests } from '@/mocks/operations-data'
import { properties, units } from '@/mocks/data'
import type { MaintenanceRequest } from '@/types/domain'

const money = new Intl.NumberFormat('ar-SA', { style: 'currency', currency: 'SAR', maximumFractionDigits: 0 })
const statusLabel = (status?: MaintenanceRequest['approvalStatus']) => ({ pending: 'بانتظار اعتماد المالك', approved: 'معتمد', rejected: 'مرفوض', not_required: 'لا يحتاج اعتماداً' })[status ?? 'not_required']

export function MaintenanceListPage() {
  const [requests, setRequests] = useState<MaintenanceRequest[]>(() => maintenanceRequests.map((item) => ({ ...item })))
  const [loading] = useState(false)
  const [failed, setFailed] = useState(false)
  const load = () => { setFailed(false); maintenanceRepository.list().then(setRequests).catch(() => setFailed(true)) }
  const decide = (id: string, approvalStatus: 'approved' | 'rejected') => { const update = { approvalStatus, status: approvalStatus === 'approved' ? 'confirmed' as const : 'cancelled' as const }; maintenanceRepository.update(id, update).then(() => setRequests((items) => items.map((item) => item.id === id ? { ...item, ...update } : item))) }
  if (loading) return <div className="content"><LoadingState label="جارٍ تحميل طلبات الصيانة..." /></div>
  if (failed) return <div className="content"><ErrorState onRetry={load} /></div>
  if (!requests.length) return <div className="content"><EmptyState title="لا توجد طلبات صيانة" description="أضف طلب صيانة لبدء المتابعة والاعتماد." action={<Link className="add-button" href="/maintenance/new">طلب صيانة جديد</Link>} /></div>

  return <div className="content">
    <div className="module-title"><div><span className="overline">التشغيل والصيانة</span><h1>طلبات الصيانة</h1><p>تابع التكلفة والمورد واعتماد المالك وحالة الإنجاز لكل طلب.</p></div><Link className="add-button" href="/maintenance/new">طلب صيانة جديد</Link></div>
    <section className="card operations-list">
      {requests.map((item) => {
        const property = properties.find((entry) => entry.id === item.propertyId)
        const unit = units.find((entry) => entry.id === item.unitId)
        return <article key={item.id} className="operation-card"><div className="operation-heading"><div><span className="status-chip">{statusLabel(item.approvalStatus)}</span><h2>{item.title}</h2><p>{property?.propertyName} · {unit?.unitNameOrNumber} · أولوية {item.priority === 'high' ? 'عالية' : 'عادية'}</p></div><strong>{money.format(item.estimatedCost)}</strong></div><p>{item.description}</p><dl><div><dt>المورد المقترح</dt><dd>{item.vendorName ?? 'لم يحدد'}</dd></div><div><dt>تاريخ الطلب</dt><dd>{item.requestedAt ?? '—'}</dd></div><div><dt>اعتماد المالك</dt><dd>{item.requiresOwnerApproval ? 'مطلوب' : 'غير مطلوب'}</dd></div></dl>{item.approvalStatus === 'pending' && <div className="inline-actions"><button className="add-button" onClick={() => decide(item.id, 'approved')}><Check size={15} /> اعتماد تجريبي</button><button className="cancel-button" onClick={() => decide(item.id, 'rejected')}><X size={15} /> رفض تجريبي</button></div>}</article>
      })}
    </section>
  </div>
}

export function MaintenanceDetailPage({ id }: { id: string }) {
  const item = maintenanceRequests.find((request) => request.id === id)
  if (!item) return <div className="content"><h1>طلب الصيانة غير موجود</h1></div>
  return <div className="content"><div className="module-title"><div><span className="overline">طلب صيانة</span><h1>{item.title}</h1><p>{item.description}</p></div><Link className="cancel-button" href="/maintenance">رجوع للطلبات</Link></div><section className="card financial-grid"><span>التكلفة التقديرية <b>{money.format(item.estimatedCost)}</b></span><span>اعتماد المالك <b>{statusLabel(item.approvalStatus)}</b></span><span>المورد <b>{item.vendorName ?? 'لم يحدد'}</b></span></section></div>
}
