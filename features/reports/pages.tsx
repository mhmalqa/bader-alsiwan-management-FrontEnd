'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { api } from '@/lib/api/http'

type Kind = 'owner-statement' | 'tenant-statement' | 'collections' | 'overdue' | 'upcoming' | 'expenses' | 'occupancy' | 'property' | 'management-portfolio'
const labels: Record<Kind, string> = { 'owner-statement': 'كشف حساب المالك', 'tenant-statement': 'كشف حساب المستأجر', collections: 'التحصيلات', overdue: 'المتأخرات', upcoming: 'الاستحقاقات القادمة', expenses: 'المصروفات', occupancy: 'الإشغال', property: 'تقرير العقار', 'management-portfolio': 'المحفظة الإدارية' }

export function ReportsIndexPage() { return <div className="content"><div className="module-title"><div><span className="overline">التقارير والتحليلات</span><h1>التقارير</h1><p>تقارير مبنية على بيانات الخادم وتصديرات قابلة للتتبع.</p></div></div><div className="report-grid">{(Object.keys(labels) as Kind[]).map(kind => <Link className="card report-card" key={kind} href={`/reports/${kind}`}><h2>{labels[kind]}</h2><p>عرض مؤشرات التقرير وتصديره من الخادم.</p></Link>)}</div></div> }

export function ReportPage({ kind }: { kind: Kind }) {
  const [data, setData] = useState<{ metrics: Record<string, number> }>(); const [error, setError] = useState(''); const [saving, setSaving] = useState(false); const [format, setFormat] = useState<'csv' | 'xlsx' | 'pdf' | 'docx'>('xlsx')
  useEffect(() => { const timer = setTimeout(() => void api<{ metrics: Record<string, number> }>(`/reports/${kind}`).then(setData).catch(error => setError(error instanceof Error ? error.message : 'تعذر تحميل التقرير.')), 0); return () => clearTimeout(timer) }, [kind])
  const exportReport = async () => { setSaving(true); setError(''); try { const job = await api<{ id: string; filename: string }>(`/reports/${kind}/export`, { method: 'POST', body: JSON.stringify({ format }) }); const download = await api<{ content: string; filename: string; contentType: string }>(`/export-jobs/${job.id}/download`); const url = URL.createObjectURL(new Blob([download.content], { type: download.contentType })); const anchor = document.createElement('a'); anchor.href = url; anchor.download = download.filename; anchor.click(); URL.revokeObjectURL(url) } catch (error) { setError(error instanceof Error ? error.message : 'تعذر تصدير التقرير.') } finally { setSaving(false) } }
  return <div className="content"><div className="module-title"><div><span className="overline">تقرير</span><h1>{labels[kind]}</h1><p>مؤشرات محسوبة في الخادم.</p></div><div className="inline-actions"><select value={format} disabled={saving} onChange={event => setFormat(event.target.value as typeof format)}><option value="xlsx">XLSX</option><option value="pdf">PDF</option><option value="docx">DOCX</option><option value="csv">CSV</option></select><button className="add-button" disabled={saving} onClick={() => void exportReport()}>{saving ? 'جارٍ التصدير…' : `تصدير ${format.toUpperCase()}`}</button></div></div>{error && <p className="error-message">{error}</p>}{!data ? <p>جارٍ تحميل التقرير…</p> : <section className="financial-grid">{Object.entries(data.metrics).map(([name, value]) => <span key={name}>{name}<b>{value}</b></span>)}</section>}</div>
}
