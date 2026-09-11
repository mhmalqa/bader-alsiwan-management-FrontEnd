'use client'
import Link from 'next/link'
import { useEffect,useState } from 'react'
import { DataTable } from '@/components/shared/data-table'
import { listLeases,type Lease } from './api'
export function LeasesListPage(){const [items,setItems]=useState<Lease[]>([]);const [loading,setLoading]=useState(true);const [error,setError]=useState('');useEffect(()=>{void listLeases().then(({items})=>setItems(items)).catch(()=>setError('تعذر تحميل عقود الإيجار.')).finally(()=>setLoading(false))},[]);return <div className="content"><div className="module-title"><div><span className="overline">العقود والتحصيل</span><h1>عقود الإيجار</h1><p>عقود الإيجار المحفوظة في الخادم.</p></div><Link className="add-button" href="/leases/new">إضافة عقد إيجار</Link></div>{loading?<p>جارٍ تحميل العقود…</p>:error?<p role="alert" className="error-message">{error}</p>:<DataTable rows={items} columns={[{key:'internalNumber',title:'رقم العقد'},{key:'tenantId',title:'المستأجر'},{key:'startDate',title:'البداية'},{key:'endDate',title:'النهاية'},{key:'totalValue',title:'إجمالي العقد'},{key:'status',title:'الحالة'}]}/>}</div>}
