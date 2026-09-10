'use client'
import Link from 'next/link'
import { useState } from 'react'
import { DataTable } from '@/components/shared/data-table'
import { EntityPreviewModal } from '@/components/shared/entity-preview-modal'
import { properties } from '@/mocks/data'
export function PropertiesListPage() { const [selected, setSelected] = useState<string>(); return <div className="content"><div className="module-title"><div><span className="overline">محفظة العقارات</span><h1>العقارات</h1><p>العقارات ومواقعها ووحداتها وحالة إدارتها.</p></div><Link className="add-button" href="/properties/new">إضافة عقار</Link></div><DataTable rows={properties} columns={[{ key: 'propertyCode', title: 'رمز العقار' }, { key: 'propertyName', title: 'اسم العقار' }, { key: 'ownerId', title: 'المالك' }, { key: 'propertyType', title: 'النوع' }, { key: 'city', title: 'المدينة' }, { key: 'unitsCount', title: 'الوحدات' }, { key: 'managementStatus', title: 'حالة الإدارة' }, { key: 'id', title: 'الإجراء', render: (_value, property) => <button className="cancel-button property-profile-action" onClick={() => setSelected(property.id)}>استعراض العقار</button> }]} /><EntityPreviewModal open={Boolean(selected)} entityType="property" entityId={selected} onClose={() => setSelected(undefined)} /></div> }
