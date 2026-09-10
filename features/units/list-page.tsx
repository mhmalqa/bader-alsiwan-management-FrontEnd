'use client'
import Link from 'next/link'
import { useState } from 'react'
import { DataTable } from '@/components/shared/data-table'
import { EntityPreviewModal } from '@/components/shared/entity-preview-modal'
import { units } from '@/mocks/data'
export function UnitsListPage() { const [selected, setSelected] = useState<string>(); return <div className="content"><div className="module-title"><div><span className="overline">مكونات العقار</span><h1>الوحدات والشقق والأدوار</h1><p>الأجزاء القابلة للتأجير وحالة الإشغال والعائد المتوقع.</p></div><Link className="add-button" href="/units/new">إضافة وحدة</Link></div><DataTable rows={units} columns={[{ key: 'unitCode', title: 'رمز الوحدة' }, { key: 'propertyId', title: 'العقار' }, { key: 'unitNameOrNumber', title: 'اسم أو رقم الوحدة' }, { key: 'unitType', title: 'النوع' }, { key: 'area', title: 'المساحة' }, { key: 'expectedAnnualRent', title: 'الإيجار السنوي' }, { key: 'status', title: 'الحالة' }, { key: 'id', title: 'الإجراء', render: (_value, unit) => <button className="cancel-button unit-profile-action" onClick={() => setSelected(unit.id)}>استعراض الوحدة</button> }]} /><EntityPreviewModal open={Boolean(selected)} entityType="unit" entityId={selected} onClose={() => setSelected(undefined)} /></div> }
