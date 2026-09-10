'use client'

import Link from 'next/link'
import { useState } from 'react'
import { AttachmentUploader, type LocalAttachment } from '@/components/shared/attachment-uploader'
import { expenses, leases, owners, payments, properties, receivables, tenants, units } from '@/mocks/data'

const tabs = ['نظرة عامة', 'الوحدات', 'المستأجرون والعقود', 'الاستحقاقات والدفعات', 'المصروفات والصيانة', 'المرفقات'] as const
type Tab = typeof tabs[number]
const money = (amount: number) => `${new Intl.NumberFormat('ar-SA').format(amount)} ر.س`

export function PropertyDetailsPage({ id }: { id: string }) {
  const [tab, setTab] = useState<Tab>('نظرة عامة')
  const [attachments, setAttachments] = useState<LocalAttachment[]>([])
  const property = properties.find((item) => item.id === id)
  if (!property) return <div className="content">العقار غير موجود.</div>
  const owner = owners.find((item) => item.id === property.ownerId)
  const propertyUnits = units.filter((item) => item.propertyId === id)
  const unitIds = new Set(propertyUnits.map((item) => item.id))
  const contracts = leases.filter((item) => item.propertyId === id)
  const propertyReceivables = receivables.filter((item) => item.propertyId === id)
  const propertyPayments = payments.filter((item) => item.propertyId === id)
  const propertyExpenses = expenses.filter((item) => item.propertyId === id)
  const occupied = propertyUnits.filter((item) => item.status === 'occupied').length
  const remaining = propertyReceivables.reduce((sum, item) => sum + item.remainingAmount, 0)
  const latitude = property.location?.latitude ?? 24.774
  const longitude = property.location?.longitude ?? 46.738
  const content: Record<Tab, React.ReactNode> = {
    'نظرة عامة': <div className="property-command-center"><section className="property-identity-card"><div className="identity-mark">ع</div><div><span>العقار تحت الإدارة</span><h2>{property.propertyName}</h2><p>{property.location?.street ?? property.city}، {property.district} · {property.propertyCode}</p></div><div className="property-state"><i /> إدارة {property.managementStatus === 'active' ? 'نشطة' : property.managementStatus}</div><div className="identity-facts"><div><small>المالك</small><b>{owner?.fullName ?? '—'}</b></div><div><small>رقم الصك</small><b>{property.deedNumber ?? 'غير مسجل'}</b></div><div><small>نوع العقار</small><b>{property.propertyType}</b></div></div></section><section className="card map-card property-map-card"><div className="card-heading"><div><span className="map-label">الموقع الجغرافي</span><h2>موقع العقار</h2><p>{property.location?.street ?? property.city}، {property.district}</p></div><a className="cancel-button" target="_blank" rel="noreferrer" href={property.location?.mapUrl ?? `https://www.google.com/maps?q=${latitude},${longitude}`}>فتح في الخرائط</a></div><iframe title="موقع العقار" src={`https://www.google.com/maps?q=${latitude},${longitude}&z=15&output=embed`} loading="lazy" /><div className="coordinates"><span>خط العرض {latitude}</span><span>خط الطول {longitude}</span></div></section></div>,
    الوحدات: <section className="card"><h2>الوحدات والشقق والأدوار</h2>{propertyUnits.map((unit) => <div className="summary-row" key={unit.id}><div><b>{unit.unitNameOrNumber}</b><span>{unit.unitType} · {unit.area} م² · {unit.status === 'occupied' ? 'مؤجرة' : 'شاغرة'}</span></div><Link className="cancel-button" href={`/units/${unit.id}`}>تفاصيل الوحدة</Link></div>)}</section>,
    'المستأجرون والعقود': <section className="card"><h2>المستأجرون وعقود الإيجار</h2>{contracts.map((contract) => { const tenant = tenants.find((item) => item.id === contract.tenantId); const unit = units.find((item) => item.id === contract.unitId); return <div className="summary-row" key={contract.id}><div><b>{tenant?.fullName ?? '—'}</b><span>{contract.internalContractNumber} · {unit?.unitNameOrNumber ?? 'العقار بالكامل'} · حتى {contract.endDate}</span></div><Link className="cancel-button" href={`/tenants/${contract.tenantId}`}>ملف المستأجر</Link></div> })}</section>,
    'الاستحقاقات والدفعات': <div className="property-detail-grid"><section className="card"><h2>الاستحقاقات</h2>{propertyReceivables.map((item) => <div className="summary-row" key={item.id}><div><b>القسط {item.installmentNumber}</b><span>استحقاق: {item.dueDate}</span></div><b>{money(item.remainingAmount)} متبقي</b></div>)}</section><section className="card"><h2>الدفعات المحصلة</h2>{propertyPayments.map((item) => <div className="summary-row" key={item.id}><div><b>{item.paymentNumber}</b><span>{item.paymentDate} · {tenants.find((tenant) => tenant.id === item.tenantId)?.fullName ?? '—'}</span></div><b>{money(item.amount)}</b></div>)}<Link className="add-button" href="/payments/new">تسجيل دفعة</Link></section></div>,
    'المصروفات والصيانة': <section className="card"><h2>المصروفات والصيانة</h2>{propertyExpenses.map((expense) => <div className="summary-row" key={expense.id}><div><b>{expense.description}</b><span>{expense.expenseDate} · {expense.category} · {expense.vendorName ?? 'بدون مورد'}</span></div><b>{money(expense.amount)}</b></div>)}<div className="page-actions"><Link className="add-button" href="/expenses/new">إضافة مصروف</Link><Link className="cancel-button" href="/maintenance/new">طلب صيانة</Link></div></section>,
    المرفقات: <section className="card"><h2>صكوك ووثائق العقار</h2><AttachmentUploader value={attachments} onChange={setAttachments} entityType="property" entityId={property.id} category="وثائق عقار" /></section>,
  }
  return <div className="content property-profile"><div className="module-title property-title"><div><span className="overline">ملف العقار الشامل</span><h1>{property.propertyName}</h1><p>{property.propertyCode} · {property.city} · {property.district}</p></div><div className="page-actions"><Link className="cancel-button" href={`/owners/${property.ownerId}`}>ملف المالك</Link><Link className="add-button" href={`/properties/${id}/edit`}>تعديل العقار</Link></div></div><div className="property-kpis"><article><span>إجمالي الوحدات</span><strong>{propertyUnits.length}</strong><small>وحدة ضمن العقار</small></article><article><span>الوحدات المؤجرة</span><strong>{occupied}</strong><small>{propertyUnits.length ? `${Math.round(occupied / propertyUnits.length * 100)}% نسبة الإشغال` : 'لا توجد وحدات'}</small></article><article><span>التحصيلات المؤكدة</span><strong>{money(propertyPayments.filter((item) => item.status === 'confirmed').reduce((sum, item) => sum + item.amount, 0))}</strong><small>من دفعات المستأجرين</small></article><article><span>الاستحقاقات المتبقية</span><strong>{money(remaining)}</strong><small>تحتاج متابعة التحصيل</small></article></div><div className="detail-tabs">{tabs.map((item) => <button key={item} className={tab === item ? 'active' : ''} onClick={() => setTab(item)}>{item}</button>)}</div>{content[tab]}</div>
}
