'use client'

import { useState } from 'react'
import { AttachmentUploader, type LocalAttachment } from '@/components/shared/attachment-uploader'
import { notifySuccess } from '@/components/shared/app-toast'
import { owners, properties } from '@/mocks/data'
import { createQuickRecord } from '@/services/quick-create'

const services = ['تسويق العقار', 'إعادة التسويق عند الشغور', 'إدارة الاستفسارات', 'تنسيق المعاينات', 'إجراءات التأجير', 'متابعة عقد الإيجار', 'تحصيل الإيجارات', 'إشعارات المالك', 'تنسيق شؤون المستأجر', 'تنسيق الصيانة', 'استلام وتسليم الوحدة']
const exclusions = ['قطع الغيار غير مشمولة', 'عمالة الصيانة غير مشمولة', 'المشتريات تحتاج موافقة المالك', 'الأعمال الإضافية تحتاج موافقة المالك']

export function ManagementContractFormPage() {
  const [ownerId, setOwnerId] = useState(owners[0]?.id ?? '')
  const [propertyIds, setPropertyIds] = useState<string[]>(properties.filter((item) => item.ownerId === owners[0]?.id).map((item) => item.id))
  const [selectedServices, setSelectedServices] = useState(new Set([services[0], services[5], services[6]]))
  const [selectedExclusions, setSelectedExclusions] = useState(new Set(exclusions))
  const [attachments, setAttachments] = useState<LocalAttachment[]>([])
  const [savedId, setSavedId] = useState<string>()
  const [error, setError] = useState('')
  const toggle = (setValue: React.Dispatch<React.SetStateAction<Set<string>>>, value: string) => setValue((current) => { const next = new Set(current); next.has(value) ? next.delete(value) : next.add(value); return next })
  const save = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    try {
      const record = await createQuickRecord('managementContract', { contractNumber: String(data.get('contractNumber') ?? ''), ownerId, startDate: String(data.get('startDate') ?? ''), endDate: String(data.get('endDate') ?? ''), managementFeeMethod: String(data.get('managementFeeMethod') ?? ''), managementFeePercentage: String(data.get('managementFeePercentage') ?? '0'), paymentTerms: String(data.get('paymentTerms') ?? ''), terminationTerms: String(data.get('terminationTerms') ?? ''), notes: String(data.get('notes') ?? ''), managedPropertyIds: propertyIds.join(','), serviceScope: [...selectedServices].join(','), exclusions: [...selectedExclusions].join(',') })
      setSavedId(record.id); setError(''); notifySuccess({ title: 'تم حفظ عقد الإدارة', description: 'حُفظ نطاق العقارات والخدمات والرسوم كمسودة قابلة للمراجعة.' })
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'تعذر حفظ عقد الإدارة.') }
  }
  const ownerProperties = properties.filter((item) => item.ownerId === ownerId)
  return <div className="content"><div className="module-title"><div><span className="overline">عقد إدارة جديد</span><h1>إعداد عقد إدارة المالك</h1><p>حدّد النطاق والخدمات والرسوم ثم احفظ المسودة الموثقة.</p></div></div><form className="card management-form" onSubmit={save}><section><h2>بيانات العقد</h2><div className="lease-main-fields"><label>رقم العقد<input name="contractNumber" required defaultValue="MC-2026-002" /></label><label>المالك<select value={ownerId} onChange={(event) => { setOwnerId(event.target.value); setPropertyIds([]) }}>{owners.map((owner) => <option key={owner.id} value={owner.id}>{owner.fullName}</option>)}</select></label><label>تاريخ البداية<input name="startDate" required type="date" defaultValue="2026-01-01" /></label><label>تاريخ النهاية<input name="endDate" required type="date" defaultValue="2026-12-31" /></label><label className="full-width">العقارات المشمولة<select multiple value={propertyIds} onChange={(event) => setPropertyIds(Array.from(event.currentTarget.selectedOptions, (option) => option.value))}>{ownerProperties.map((property) => <option key={property.id} value={property.id}>{property.propertyName}</option>)}</select></label></div></section><section><h2>رسوم الإدارة</h2><div className="lease-main-fields"><label>طريقة الاحتساب<select name="managementFeeMethod" defaultValue="نسبة من التحصيل"><option>نسبة من التحصيل</option><option>مبلغ ثابت</option><option>نسبة + مبلغ ثابت</option><option>مخصص</option></select></label><label>نسبة الإدارة<input name="managementFeePercentage" type="number" min="0" max="100" defaultValue="5" /></label><label>شروط الدفع<input name="paymentTerms" /></label><label>شروط الإنهاء<input name="terminationTerms" /></label></div></section><section><h2>الخدمات المشمولة</h2><div className="check-grid">{services.map((service) => <label key={service}><input type="checkbox" checked={selectedServices.has(service)} onChange={() => toggle(setSelectedServices, service)} />{service}</label>)}</div></section><section><h2>الاستثناءات</h2><div className="check-grid">{exclusions.map((item) => <label key={item}><input type="checkbox" checked={selectedExclusions.has(item)} onChange={() => toggle(setSelectedExclusions, item)} />{item}</label>)}</div><label>ملاحظات<textarea name="notes" /></label></section><AttachmentUploader value={attachments} onChange={setAttachments} entityType="management_contract" entityId={savedId ?? 'new'} category="عقد إدارة" />{error && <p className="error-message">{error}</p>}<div className="form-actions"><button className="add-button" type="submit">حفظ عقد الإدارة</button></div></form></div>
}
