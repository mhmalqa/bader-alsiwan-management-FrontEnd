'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { getPropertyPortfolio, type PropertyPortfolio } from './api'

export function PropertyDetailsPage({ id }: { id: string }) {
  const [portfolio, setPortfolio] = useState<PropertyPortfolio>(); const [loading, setLoading] = useState(true); const [error, setError] = useState('')
  useEffect(() => { let active = true; void getPropertyPortfolio(id).then(value => { if (active) setPortfolio(value) }).catch(() => { if (active) setError('تعذر تحميل ملف العقار.') }).finally(() => { if (active) setLoading(false) }); return () => { active = false } }, [id])
  if (loading) return <div className="content">جارٍ تحميل ملف العقار…</div>
  if (!portfolio) return <div className="content" role="alert">{error || 'العقار غير موجود.'}</div>
  const { property, spaces } = portfolio; const expectedRent = spaces.reduce((total, space) => total + Number(space.expectedAnnualRent ?? 0), 0)
  return <div className="content property-profile"><div className="module-title property-title"><div><span className="overline">ملف العقار</span><h1>{property.propertyName}</h1><p>{property.propertyCode} · {property.city} · {property.district}</p></div><div className="page-actions"><Link className="cancel-button" href={`/owners/${property.ownerId}`}>ملف المالك</Link><Link className="add-button" href={`/properties/${id}/edit`}>تعديل العقار</Link></div></div><div className="property-kpis"><article><span>إجمالي المساحات</span><strong>{spaces.length}</strong><small>مساحة ضمن العقار</small></article><article><span>المساحات النشطة</span><strong>{spaces.filter(space => space.status === 'active').length}</strong><small>متاحة للتشغيل</small></article><article><span>الإيجار السنوي المتوقع</span><strong>{new Intl.NumberFormat('ar-SA').format(expectedRent)} ر.س</strong><small>من المساحات المسجلة</small></article></div><section className="card"><h2>المساحات والوحدات</h2>{spaces.length ? spaces.map(space => <div className="summary-row" key={space.id}><div><b>{space.unitNameOrNumber}</b><span>{space.unitCode} · {space.unitType}{space.floor ? ` · الدور ${space.floor}` : ''}</span></div><small>{space.expectedAnnualRent ? `${new Intl.NumberFormat('ar-SA').format(Number(space.expectedAnnualRent))} ر.س` : 'لم يحدد إيجار متوقع'}</small></div>) : <p>لا توجد مساحات مسجلة لهذا العقار.</p>}</section><section className="card"><h2>سجل التشغيل</h2><p>العقود والاستحقاقات والمصروفات تظهر من API عند تنفيذ مواردها؛ لا تعرض هذه الصفحة بيانات محلية بديلة.</p></section></div>
}
