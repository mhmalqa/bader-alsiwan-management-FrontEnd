'use client'
import Link from 'next/link'
import { useEffect,useState } from 'react'
import { DataTable } from '@/components/shared/data-table'
import { api } from '@/lib/api/http'
import type { PropertySpace } from '@/features/properties/api'
export function UnitsListPage(){const [items,setItems]=useState<PropertySpace[]>([]);const [loading,setLoading]=useState(true);const [error,setError]=useState('');useEffect(()=>{void api<{items:PropertySpace[]}>('/property-spaces').then(({items})=>setItems(items)).catch(()=>setError('تعذر تحميل المساحات.')).finally(()=>setLoading(false))},[]);return <div className="content"><div className="module-title"><div><span className="overline">مكونات العقار</span><h1>الوحدات والشقق والأدوار</h1><p>المساحات القابلة للتأجير من الخادم.</p></div><Link className="add-button" href="/units/new">إضافة وحدة</Link></div>{loading?<p>جارٍ تحميل المساحات…</p>:error?<p role="alert" className="error-message">{error}</p>:<DataTable rows={items} columns={[{key:'unitCode',title:'رمز الوحدة'},{key:'propertyId',title:'العقار'},{key:'unitNameOrNumber',title:'الاسم'},{key:'unitType',title:'النوع'},{key:'area',title:'المساحة'},{key:'expectedAnnualRent',title:'الإيجار المتوقع'},{key:'status',title:'الحالة'},{key:'id',title:'الإجراء',render:(_,unit)=><Link className="cancel-button" href={`/units/${unit.id}`}>عرض</Link>}]}/>}</div>}
