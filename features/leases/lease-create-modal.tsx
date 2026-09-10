'use client'

import { useMemo, useState } from 'react'
import { AttachmentUploader, type LocalAttachment } from '@/components/shared/attachment-uploader'
import { AppDialog } from '@/components/shared/app-dialog'
import { SearchableSelect } from '@/components/shared/searchable-select'
import { properties, tenants, units } from '@/mocks/data'
import { createQuickRecord } from '@/services/quick-create'

type Props = { open: boolean; onClose: () => void }

const frequencyOptions = [
  ['annual', 'سنوي'], ['semi_annual', 'نصف سنوي'], ['quarterly', 'ربع سنوي'], ['monthly', 'شهري'], ['one_time', 'دفعة واحدة'], ['custom', 'مخصص'],
] as const

export function LeaseCreateModal({ open, onClose }: Props) {
  const [values, setValues] = useState({ internalContractNumber: '', ejarContractNumber: '', tenantId: '', propertyId: '', unitId: '', leasedSpaceType: 'unit', leasedSpaceLabel: '', startDate: '', endDate: '', annualRent: '', paymentFrequency: 'annual', securityDeposit: '', noticePeriodDays: '' })
  const [attachments, setAttachments] = useState<LocalAttachment[]>([])
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState('')
  const availableUnits = useMemo(() => units.filter((unit) => !values.propertyId || unit.propertyId === values.propertyId), [values.propertyId])
  const update = (key: keyof typeof values, value: string) => setValues((current) => ({ ...current, [key]: value, ...(key === 'propertyId' ? { unitId: '' } : {}) }))
  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!values.internalContractNumber || !values.tenantId || !values.propertyId || (values.leasedSpaceType === 'unit' && !values.unitId) || (values.leasedSpaceType === 'floor' && !values.leasedSpaceLabel) || !values.startDate || !values.endDate || !values.annualRent) return
    setSaving(true)
    await createQuickRecord('lease', values)
    setSaving(false)
    setNotice('تم حفظ عقد الإيجار وجدول أقساطه بنجاح.')
  }
  const close = () => { setNotice(''); onClose() }

  return <AppDialog open={open} onClose={close} title="إضافة عقد إيجار" description="سجّل العقد، الطرف المؤجر، الوحدة ودورية التحصيل من نافذة واحدة.">
    <form className="specialized-modal-form" onSubmit={submit}>
      <section className="modal-form-section"><h3>بيانات العقد</h3><div className="modal-form-grid">
        <label>رقم العقد الداخلي <em>*</em><input required value={values.internalContractNumber} onChange={(event) => update('internalContractNumber', event.target.value)} placeholder="مثال: L-2026-001" /></label>
        <label>رقم عقد إيجار <input value={values.ejarContractNumber} onChange={(event) => update('ejarContractNumber', event.target.value)} placeholder="إن وجد" /></label>
        <label>المستأجر <em>*</em><SearchableSelect required value={values.tenantId} onChange={(value) => update('tenantId', value)} options={tenants.map((tenant) => ({ value: tenant.id, label: tenant.fullName }))} placeholder="ابحث واختر المستأجر" /></label>
        <label>العقار <em>*</em><SearchableSelect required value={values.propertyId} onChange={(value) => update('propertyId', value)} options={properties.map((property) => ({ value: property.id, label: property.propertyName }))} placeholder="ابحث واختر العقار" /></label>
        <label>نطاق التأجير <em>*</em><select value={values.leasedSpaceType} onChange={(event) => update('leasedSpaceType', event.target.value)}><option value="unit">وحدة / شقة</option><option value="floor">دور كامل</option><option value="whole_property">العقار بالكامل</option></select></label>
        {values.leasedSpaceType === 'unit' ? <label>الوحدة / الشقة <em>*</em><SearchableSelect required disabled={!values.propertyId} value={values.unitId} onChange={(value) => update('unitId', value)} options={availableUnits.map((unit) => ({ value: unit.id, label: unit.unitNameOrNumber }))} placeholder="ابحث واختر الوحدة" /></label> : values.leasedSpaceType === 'floor' ? <label>اسم أو رقم الدور <em>*</em><input required value={values.leasedSpaceLabel} onChange={(event) => update('leasedSpaceLabel', event.target.value)} placeholder="مثال: الدور الأول" /></label> : <label>المساحة المؤجرة<input readOnly value={properties.find((property) => property.id === values.propertyId)?.propertyName ?? 'اختر العقار أولاً'} /></label>}
      </div></section>
      <section className="modal-form-section"><h3>المدة والتحصيل</h3><div className="modal-form-grid">
        <label>تاريخ بداية العقد <em>*</em><input required type="date" value={values.startDate} onChange={(event) => update('startDate', event.target.value)} /></label>
        <label>تاريخ نهاية العقد <em>*</em><input required type="date" value={values.endDate} onChange={(event) => update('endDate', event.target.value)} /></label>
        <label>قيمة الإيجار السنوي (ر.س) <em>*</em><input required min="1" type="number" value={values.annualRent} onChange={(event) => update('annualRent', event.target.value)} /></label>
        <label>دورية السداد <em>*</em><select value={values.paymentFrequency} onChange={(event) => update('paymentFrequency', event.target.value)}>{frequencyOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
        <label>تأمين مسترد (ر.س)<input min="0" type="number" value={values.securityDeposit} onChange={(event) => update('securityDeposit', event.target.value)} /></label>
        <label>فترة الإشعار (أيام)<input min="0" type="number" value={values.noticePeriodDays} onChange={(event) => update('noticePeriodDays', event.target.value)} /></label>
      </div></section>
      <section className="modal-form-section"><AttachmentUploader value={attachments} onChange={setAttachments} entityType="lease" category="عقد إيجار ومنصة إيجار" /></section>
      {notice && <p className="success-message">{notice}</p>}
      <footer className="modal-actions"><button type="button" className="cancel-button" onClick={close}>إلغاء</button><button className="add-button" type="submit" disabled={saving}>{saving ? 'جارٍ الحفظ...' : 'حفظ عقد الإيجار'}</button></footer>
    </form>
  </AppDialog>
}
