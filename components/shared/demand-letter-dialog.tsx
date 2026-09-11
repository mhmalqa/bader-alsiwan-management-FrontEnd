'use client'

import { Download, Send } from 'lucide-react'
import { useEffect, useState } from 'react'
import { AppDialog } from '@/components/shared/app-dialog'
import { api } from '@/lib/api/http'

type Context = { receivableId: string; tenantName: string; dueDate: string; balance: number; allowedTemplateKeys: string[] }
type Draft = { generatedDocument: { id: string; renderedBody: string }; collectionFollowUp: { id: string; status: string } }

export function DemandLetterDialog({ receivable, onClose }: { receivable: { id: string } | null; onClose: () => void }) {
  const [context, setContext] = useState<Context>(); const [body, setBody] = useState(''); const [draft, setDraft] = useState<Draft>(); const [error, setError] = useState(''); const [saving, setSaving] = useState(false)
  useEffect(() => {
    if (!receivable) return
    const timer = setTimeout(() => void api<Context>(`/receivables/${receivable.id}/demand-letter-context`).then(context => { setContext(context); setBody(`السادة/ ${context.tenantName}\n\nنرجو سداد مبلغ ${context.balance} المستحق بتاريخ ${context.dueDate}.`) }).catch(error => setError(error instanceof Error ? error.message : 'تعذر تحميل سياق الخطاب.')), 0)
    return () => clearTimeout(timer)
  }, [receivable])
  const generate = async () => { if (!receivable) return; setSaving(true); setError(''); try { setDraft(await api<Draft>(`/receivables/${receivable.id}/demand-letter/draft`, { method: 'POST', body: JSON.stringify({ templateKey: 'payment_demand', locale: 'ar', renderedBody: body }) })) } catch (error) { setError(error instanceof Error ? error.message : 'تعذر توليد المسودة.') } finally { setSaving(false) } }
  const download = async () => { if (!draft) return; setSaving(true); try { const exported = await api<{ filename: string; content: string; contentType: string }>(`/generated-documents/${draft.generatedDocument.id}/export`, { method: 'POST' }); const url = URL.createObjectURL(new Blob([exported.content], { type: exported.contentType })); const anchor = document.createElement('a'); anchor.href = url; anchor.download = exported.filename; anchor.click(); URL.revokeObjectURL(url) } catch (error) { setError(error instanceof Error ? error.message : 'تعذر تنزيل الخطاب.') } finally { setSaving(false) } }
  const send = async () => { if (!draft || !context) return; setSaving(true); try { await api(`/collection-follow-ups/${draft.collectionFollowUp.id}/send`, { method: 'POST', body: JSON.stringify({ channel: 'manual', recipient: context.tenantName }) }); onClose() } catch (error) { setError(error instanceof Error ? error.message : 'تعذر إرسال الخطاب.') } finally { setSaving(false) } }
  return <AppDialog open={Boolean(receivable)} onClose={saving ? () => undefined : onClose} title="توليد خطاب مطالبة" description={context ? `${context.tenantName} · المتبقي ${context.balance}` : 'جارٍ التحميل…'}><div className="demand-letter-editor"><label><span>نص الخطاب</span><textarea rows={16} value={body} disabled={saving} onChange={event => setBody(event.target.value)} /></label>{error && <p className="error-message">{error}</p>}{draft && <pre>{draft.generatedDocument.renderedBody}</pre>}<div className="demand-letter-editor__actions"><button className="add-button" type="button" disabled={saving || !context} onClick={() => void generate()}>{saving ? 'جارٍ الحفظ…' : 'توليد مسودة'}</button><button className="icon-action" type="button" disabled={saving || !draft} onClick={() => void download()}><Download size={16} /> تنزيل</button><button className="icon-action primary" type="button" disabled={saving || !draft} onClick={() => void send()}><Send size={16} /> إرسال</button></div></div></AppDialog>
}
