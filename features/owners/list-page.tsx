'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { DataTable } from '@/components/shared/data-table'
import { listOwners, type Owner } from '@/features/owners/api'

export function OwnersListPage() {
  const [owners, setOwners] = useState<Owner[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  useEffect(() => { listOwners().then(({ items }) => setOwners(items)).catch(() => setError('تعذر تحميل الملاك.')).finally(() => setLoading(false)) }, [])
  return <div className="content"><div className="module-title"><div><span className="overline">إدارة الأملاك</span><h1>الملاك</h1><p>بيانات الملاك وحساباتهم البنكية وعقاراتهم المسندة إليهم.</p></div><Link className="add-button" href="/owners/new">إضافة مالك</Link></div>{loading ? <p>جارٍ تحميل الملاك…</p> : error ? <p role="alert">{error}</p> : <DataTable rows={owners} columns={[{ key: 'ownerCode', title: 'رمز المالك' }, { key: 'fullName', title: 'الاسم' }, { key: 'mobilePrimary', title: 'الجوال' }, { key: 'city', title: 'المدينة' }, { key: 'status', title: 'الحالة' }, { key: 'id', title: 'الإجراء', render: (_value, owner) => <Link className="cancel-button owner-profile-action" href={`/owners/${owner.id}`}>استعراض المالك</Link> }]} />}</div>
}
