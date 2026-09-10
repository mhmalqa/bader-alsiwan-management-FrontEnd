'use client'
import Link from 'next/link'
import { useState } from 'react'
import { DataTable } from '@/components/shared/data-table'
import { EntityPreviewModal } from '@/components/shared/entity-preview-modal'
import { owners } from '@/mocks/data'
export function OwnersListPage() { const [selected, setSelected] = useState<string>(); return <div className="content"><div className="module-title"><div><span className="overline">إدارة الأملاك</span><h1>الملاك</h1><p>بيانات الملاك وحساباتهم البنكية والعقارات المسندة إليهم.</p></div><Link className="add-button" href="/owners/new">إضافة مالك</Link></div><DataTable rows={owners} columns={[{ key: 'ownerCode', title: 'رمز المالك' }, { key: 'fullName', title: 'الاسم' }, { key: 'mobilePrimary', title: 'الجوال' }, { key: 'city', title: 'المدينة' }, { key: 'status', title: 'الحالة' }, { key: 'id', title: 'الإجراء', render: (_value, owner) => <button className="cancel-button owner-profile-action" onClick={() => setSelected(owner.id)}>استعراض المالك</button> }]} /><EntityPreviewModal open={Boolean(selected)} entityType="owner" entityId={selected} onClose={() => setSelected(undefined)} /></div> }
