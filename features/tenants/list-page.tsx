'use client'
import Link from 'next/link'
import { useState } from 'react'
import { DataTable } from '@/components/shared/data-table'
import { EntityPreviewModal } from '@/components/shared/entity-preview-modal'
import { tenants } from '@/mocks/data'
export function TenantsListPage() { const [selected, setSelected] = useState<string>(); return <div className="content"><div className="module-title"><div><span className="overline">إدارة المستأجرين</span><h1>المستأجرون</h1><p>السجلات الشخصية والتواصل والعقود والاستحقاقات.</p></div><Link className="add-button" href="/tenants/new">إضافة مستأجر</Link></div><DataTable rows={tenants} columns={[{ key: 'tenantCode', title: 'رمز المستأجر' }, { key: 'fullName', title: 'الاسم' }, { key: 'nationalIdOrIqama', title: 'الهوية أو الإقامة' }, { key: 'mobilePrimary', title: 'الجوال' }, { key: 'email', title: 'البريد الإلكتروني' }, { key: 'status', title: 'الحالة' }, { key: 'id', title: 'الإجراء', render: (_value, tenant) => <button className="cancel-button tenant-profile-action" onClick={() => setSelected(tenant.id)}>استعراض المستأجر</button> }]} /><EntityPreviewModal open={Boolean(selected)} entityType="tenant" entityId={selected} onClose={() => setSelected(undefined)} /></div> }
