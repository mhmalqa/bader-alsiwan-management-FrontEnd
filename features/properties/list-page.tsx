'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { DataTable } from '@/components/shared/data-table'
import { listProperties, type Property } from './api'
export function PropertiesListPage() { const [items,setItems]=useState<Property[]>([]); const [loading,setLoading]=useState(true); const [error,setError]=useState(''); useEffect(()=>{listProperties().then(({items})=>setItems(items)).catch(()=>setError('تعذر تحميل العقارات.')).finally(()=>setLoading(false))},[]); return <div className="content"><div className="module-title"><div><span className="overline">إدارة الأملاك</span><h1>العقارات</h1></div><Link className="add-button" href="/properties/new">إضافة عقار</Link></div>{loading?<p>جارٍ تحميل العقارات…</p>:error?<p role="alert">{error}</p>:<DataTable rows={items} columns={[{key:'propertyCode',title:'رمز العقار'},{key:'propertyName',title:'اسم العقار'},{key:'ownerName',title:'المالك'},{key:'city',title:'المدينة'},{key:'status',title:'الحالة'},{key:'id',title:'الإجراء',render:(_,row)=><Link className="cancel-button" href={`/properties/${row.id}`}>عرض</Link>}]}/>}</div> }
