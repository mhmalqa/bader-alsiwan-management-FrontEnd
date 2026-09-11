'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { DataTable } from '@/components/shared/data-table'
import { listTenants, type Tenant } from './api'
export function TenantsListPage(){const [items,setItems]=useState<Tenant[]>([]);const [loading,setLoading]=useState(true);const [error,setError]=useState('');useEffect(()=>{listTenants().then(({items})=>setItems(items)).catch(()=>setError('تعذر تحميل المستأجرين.')).finally(()=>setLoading(false))},[]);return <div className="content"><div className="module-title"><div><span className="overline">إدارة الأملاك</span><h1>المستأجرون</h1></div><Link className="add-button" href="/tenants/new">إضافة مستأجر</Link></div>{loading?<p>جارٍ تحميل المستأجرين…</p>:error?<p role="alert">{error}</p>:<DataTable rows={items} columns={[{key:'tenantCode',title:'رمز المستأجر'},{key:'fullName',title:'الاسم'},{key:'mobilePrimary',title:'الجوال'},{key:'status',title:'الحالة'},{key:'id',title:'الإجراء',render:(_,row)=><Link className="cancel-button" href={`/tenants/${row.id}`}>عرض</Link>}]}/>}</div>}
