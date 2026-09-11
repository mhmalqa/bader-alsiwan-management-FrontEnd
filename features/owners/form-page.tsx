'use client'

import Link from 'next/link'
import { FormEvent, useEffect, useState } from 'react'
import { HttpError } from '@/lib/api/http'
import { createOwner, getOwner, type Owner, updateOwner } from './api'

const fields = [['ownerCode', 'رمز المالك'], ['fullName', 'الاسم الكامل'], ['nationalIdOrIqama', 'رقم الهوية أو الإقامة'], ['mobilePrimary', 'رقم الجوال'], ['city', 'المدينة']] as const
export function OwnerFormPage({ id }: { id?: string }) {
  const [values, setValues] = useState<Record<string, string>>({}); const [version, setVersion] = useState(0); const [loading, setLoading] = useState(Boolean(id)); const [saving, setSaving] = useState(false); const [error, setError] = useState(''); const [success, setSuccess] = useState('')
  useEffect(() => { if (!id) return; getOwner(id).then((owner) => { setValues(Object.fromEntries(fields.map(([key]) => [key, String(owner[key] ?? '')]))); setVersion(owner.version) }).catch(() => setError('تعذر تحميل بيانات المالك.')).finally(() => setLoading(false)) }, [id])
  async function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); setSaving(true); setError(''); setSuccess(''); const payload = { ownerCode: values.ownerCode ?? '', fullName: values.fullName ?? '', nationalIdOrIqama: values.nationalIdOrIqama ?? '', mobilePrimary: values.mobilePrimary ?? '', city: values.city ?? '' }; try { const owner = id ? await updateOwner(id, { ...payload, version }) : await createOwner(payload); setVersion(owner.version); setSuccess(`تم حفظ المالك بنجاح: ${owner.ownerCode}`) } catch (reason) { setError(reason instanceof HttpError ? reason.message : 'تعذر حفظ المالك.') } finally { setSaving(false) } }
  if (loading) return <div className="content">جارٍ تحميل بيانات المالك…</div>
  return <div className="content"><div className="module-title"><div><span className="overline">{id ? 'تعديل سجل' : 'إضافة سجل'}</span><h1>{id ? 'تعديل مالك' : 'إضافة مالك'}</h1></div></div><form className="card entity-form" onSubmit={submit}>{fields.map(([key, label]) => <label key={key}>{label}<input required disabled={saving} value={values[key] ?? ''} onChange={(event) => setValues((current) => ({ ...current, [key]: event.target.value }))} /></label>)}<div className="form-actions"><Link className="cancel-button" href="/owners">إلغاء</Link><button className="add-button" disabled={saving} type="submit">{saving ? 'جارٍ الحفظ…' : 'حفظ البيانات'}</button></div>{error && <p className="error-message" role="alert">{error}</p>}{success && <p className="success-message">{success}</p>}</form></div>
}
