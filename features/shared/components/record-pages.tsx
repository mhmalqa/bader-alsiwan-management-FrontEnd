'use client'

import Link from 'next/link'
import { useState } from 'react'
import { createQuickRecord, type QuickRecordKind } from '@/services/quick-create'
import { expenses, leases, managementContracts, owners, properties, tenants, units } from '@/mocks/data'

type EditableKind = 'owners' | 'properties' | 'units' | 'tenants' | 'leases' | 'expenses' | 'management-contracts'
type Field = { key: string; label: string; type?: 'text' | 'number' | 'date' }
type RecordValue = { id: string; [key: string]: unknown }
const definition: Record<EditableKind, { title: string; path: string; rows: RecordValue[]; fields: Field[]; createKind?: QuickRecordKind }> = {
  owners: { title: 'مالك', path: 'owners', rows: owners as unknown as RecordValue[], fields: [{ key: 'ownerCode', label: 'رمز المالك' }, { key: 'fullName', label: 'الاسم الكامل' }, { key: 'nationalIdOrIqama', label: 'رقم الهوية أو الإقامة' }, { key: 'mobilePrimary', label: 'رقم الجوال' }, { key: 'city', label: 'المدينة' }] },
  properties: { title: 'عقار', path: 'properties', rows: properties as unknown as RecordValue[], fields: [{ key: 'propertyCode', label: 'رمز العقار' }, { key: 'propertyName', label: 'اسم العقار' }, { key: 'city', label: 'المدينة' }, { key: 'district', label: 'الحي' }] },
  units: { title: 'وحدة', path: 'units', rows: units as unknown as RecordValue[], fields: [{ key: 'unitCode', label: 'رمز الوحدة' }, { key: 'unitNameOrNumber', label: 'اسم أو رقم الوحدة' }, { key: 'area', label: 'المساحة', type: 'number' }, { key: 'expectedAnnualRent', label: 'الإيجار السنوي المتوقع', type: 'number' }] },
  tenants: { title: 'مستأجر', path: 'tenants', rows: tenants as unknown as RecordValue[], fields: [{ key: 'tenantCode', label: 'رمز المستأجر' }, { key: 'fullName', label: 'الاسم الكامل' }, { key: 'nationalIdOrIqama', label: 'رقم الهوية أو الإقامة' }, { key: 'mobilePrimary', label: 'رقم الجوال' }, { key: 'email', label: 'البريد الإلكتروني' }] },
  leases: { title: 'عقد إيجار', path: 'leases', rows: leases as unknown as RecordValue[], fields: [{ key: 'internalContractNumber', label: 'رقم العقد الداخلي' }, { key: 'ejarContractNumber', label: 'رقم عقد إيجار' }, { key: 'startDate', label: 'تاريخ البداية', type: 'date' }, { key: 'endDate', label: 'تاريخ النهاية', type: 'date' }, { key: 'annualRent', label: 'الإيجار السنوي', type: 'number' }] },
  expenses: { title: 'مصروف', path: 'expenses', rows: expenses as unknown as RecordValue[], fields: [{ key: 'description', label: 'بيان المصروف' }, { key: 'category', label: 'الفئة' }, { key: 'amount', label: 'المبلغ', type: 'number' }, { key: 'expenseDate', label: 'تاريخ المصروف', type: 'date' }], createKind: undefined },
  'management-contracts': { title: 'عقد إدارة', path: 'management-contracts', rows: managementContracts as unknown as RecordValue[], fields: [{ key: 'contractNumber', label: 'رقم العقد' }, { key: 'startDate', label: 'تاريخ البداية', type: 'date' }, { key: 'endDate', label: 'تاريخ النهاية', type: 'date' }, { key: 'managementFeePercentage', label: 'نسبة الإدارة', type: 'number' }], createKind: undefined },
}
const numeric = new Set(['area', 'expectedAnnualRent', 'annualRent', 'amount', 'managementFeePercentage'])
const createKinds: Partial<Record<EditableKind, QuickRecordKind>> = { owners: 'owner', properties: 'property', units: 'unit', tenants: 'tenant', leases: 'lease' }

export function RecordFormPage({ entity, id }: { entity: EditableKind; id?: string }) {
  const config = definition[entity]
  const source = config.rows.find((item) => item.id === id)
  const [values, setValues] = useState<Record<string, string>>(() => Object.fromEntries(config.fields.map((field) => [field.key, String(source?.[field.key] ?? '')])))
  const [notice, setNotice] = useState('')
  const update = (key: string, value: string) => setValues((current) => ({ ...current, [key]: value }))
  const submit = async (event: React.FormEvent<HTMLFormElement>) => { event.preventDefault(); const changes = Object.fromEntries(config.fields.map((field) => [field.key, numeric.has(field.key) ? Number(values[field.key] || 0) : values[field.key]])); if (source) Object.assign(source, changes); else if (createKinds[entity]) await createQuickRecord(createKinds[entity], values); setNotice(`تم حفظ بيانات ${config.title} في مصدر البيانات التجريبي.`) }
  return <div className="content"><div className="module-title"><div><span className="overline">{id ? 'تعديل سجل' : 'إضافة سجل'}</span><h1>{id ? `تعديل ${config.title}` : `إضافة ${config.title}`}</h1><p>يمكنك استخدام نافذة الإضافة السريعة من شريط التطبيق أو هذا المسار المباشر.</p></div></div><form className="card entity-form" onSubmit={submit}>{config.fields.map((field) => <label key={field.key}>{field.label}<input required type={field.type ?? 'text'} value={values[field.key] ?? ''} onChange={(event) => update(field.key, event.target.value)} /></label>)}<div className="form-actions"><Link className="cancel-button" href={`/${config.path}`}>إلغاء</Link><button className="add-button" type="submit">حفظ البيانات</button></div>{notice && <p className="success-message">{notice}</p>}</form></div>
}
