'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { maintenanceSchema } from '@/schemas'
import { AttachmentUploader, type LocalAttachment } from '@/components/shared/attachment-uploader'
import { properties, units } from '@/mocks/data'
import { createQuickRecord } from '@/services/quick-create'
import { notifySuccess } from '@/components/shared/app-toast'

type MaintenanceForm = { propertyId: string; unitId: string; title: string; estimatedCost: number; description: string; requiresOwnerApproval: boolean; priority: string }

export function MaintenanceFormPage() {
  const form = useForm<MaintenanceForm>({ resolver: zodResolver(maintenanceSchema) as never, defaultValues: { propertyId: properties[0]?.id ?? '', unitId: units[0]?.id ?? '', title: '', estimatedCost: 0, description: '', requiresOwnerApproval: true, priority: 'متوسطة' } })
  const [attachments, setAttachments] = useState<LocalAttachment[]>([])
  const [savedId, setSavedId] = useState<string>()
  const [error, setError] = useState('')
  const [propertyId, setPropertyId] = useState(properties[0]?.id ?? '')
  const availableUnits = units.filter((unit) => unit.propertyId === propertyId)
  const save = async (values: MaintenanceForm) => {
    try {
      const record = await createQuickRecord('maintenance', { ...Object.fromEntries(Object.entries(values).map(([key, value]) => [key, String(value)])), requiresOwnerApproval: values.requiresOwnerApproval ? 'نعم' : 'لا' })
      setSavedId(record.id)
      setError('')
      notifySuccess({ title: 'تم تسجيل طلب الصيانة', description: 'أصبح الطلب موثقاً وجاهزاً لمسار الاعتماد.' })
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'تعذر حفظ طلب الصيانة.') }
  }
  return <div className="content"><div className="module-title"><div><span className="overline">طلب جديد</span><h1>تسجيل طلب صيانة</h1><p>يُنشأ الطلب ثم تُرفع المرفقات على السجل الموثق، ويبدأ الاعتماد عند الحاجة.</p></div></div><form className="card entity-form" onSubmit={form.handleSubmit(save)}><label>العقار<select {...form.register('propertyId')} onChange={(event) => { setPropertyId(event.target.value); form.setValue('propertyId', event.target.value); form.setValue('unitId', units.find((unit) => unit.propertyId === event.target.value)?.id ?? '') }}>{properties.map((property) => <option key={property.id} value={property.id}>{property.propertyName}</option>)}</select></label><label>الوحدة<select {...form.register('unitId')}>{availableUnits.map((unit) => <option key={unit.id} value={unit.id}>{unit.unitNameOrNumber}</option>)}</select></label><label>عنوان الطلب<input {...form.register('title')} /></label><label>الأولوية<select {...form.register('priority')}><option>منخفضة</option><option>متوسطة</option><option>عالية</option><option>طارئة</option></select></label><label>التكلفة التقديرية<input type="number" min="0" {...form.register('estimatedCost', { valueAsNumber: true })} /></label><label className="checkbox"><input type="checkbox" {...form.register('requiresOwnerApproval')} /> يتطلب اعتماد المالك</label><label className="full-width">الوصف<textarea {...form.register('description')} /></label><div className="full-width"><AttachmentUploader value={attachments} onChange={setAttachments} entityType="maintenance_request" entityId={savedId ?? 'new'} category="مرفق طلب صيانة" /></div>{error && <p className="error-message full-width">{error}</p>}<div className="form-actions"><button className="add-button" type="submit">{savedId ? 'حفظ طلب آخر' : 'حفظ الطلب'}</button></div></form></div>
}
