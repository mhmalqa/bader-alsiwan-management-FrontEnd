'use client'

import { useState } from 'react'
import { AttachmentUploader, type LocalAttachment } from '@/components/shared/attachment-uploader'
import { AppDialog } from '@/components/shared/app-dialog'
import { owners, settlements } from '@/mocks/data'
import { recordOwnerTransfer } from '@/services/operations'

type Props = { open: boolean; onClose: () => void; initialSettlementId?: string }
const money = (value: number) => `${new Intl.NumberFormat('ar-SA').format(value)} ر.س`

export function SettlementTransferModal({ open, onClose, initialSettlementId }: Props) {
  const [settlementId, setSettlementId] = useState(initialSettlementId ?? settlements[0]?.id ?? '')
  const [amount, setAmount] = useState('')
  const [reference, setReference] = useState('')
  const [attachments, setAttachments] = useState<LocalAttachment[]>([])
  const [notice, setNotice] = useState('')
  const settlement = settlements.find((item) => item.id === settlementId)
  const owner = owners.find((item) => item.id === settlement?.ownerId)
  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const transfer = Number(amount)
    if (!settlement || transfer <= 0 || transfer > settlement.remainingBalance || !reference.trim()) return
    const updated = await recordOwnerTransfer(settlement.id, { amount: transfer, transferDate: new Date().toISOString().slice(0, 10), transactionReference: reference.trim() })
    if (updated) { setNotice(`تم تسجيل التحويل. الرصيد المتبقي: ${money(updated.remainingBalance)}`); setAmount(''); setReference('') }
  }
  return <AppDialog open={open} onClose={onClose} title="تسجيل تحويل ضمن تسوية" description="يوثّق التحويل للمالك ويمنع تجاوز الرصيد المستحق في التسوية.">
    <form className="specialized-modal-form" onSubmit={submit}>
      <section className="modal-form-section"><h3>بيانات التحويل</h3><div className="modal-form-grid">
        <label>التسوية <em>*</em><select value={settlementId} onChange={(event) => setSettlementId(event.target.value)}>{settlements.filter((item) => item.status === 'confirmed' && item.remainingBalance > 0).map((item) => <option key={item.id} value={item.id}>{item.settlementNumber} — المتبقي {money(item.remainingBalance)}</option>)}</select></label>
        <label>المالك<input readOnly value={owner?.fullName ?? ''} /></label>
        <label>قيمة التحويل (ر.س) <em>*</em><input required type="number" min="1" max={settlement?.remainingBalance} value={amount} onChange={(event) => setAmount(event.target.value)} /></label>
        <label>مرجع العملية <em>*</em><input required value={reference} onChange={(event) => setReference(event.target.value)} placeholder="رقم الحوالة أو المرجع البنكي" /></label>
      </div></section>
      <div className="settlement-summary"><span>صافي المستحق <b>{money(settlement?.netDueToOwner ?? 0)}</b></span><span>المتبقي قبل التحويل <b>{money(settlement?.remainingBalance ?? 0)}</b></span></div>
      <section className="modal-form-section"><AttachmentUploader value={attachments} onChange={setAttachments} entityType="owner_settlement" entityId={settlementId} category="إثبات تحويل" /></section>
      {settlement?.status !== 'confirmed' && <p className="error-message">لا يمكن التحويل إلا من تسوية معتمدة.</p>}{notice && <p className="success-message">{notice}</p>}
      <footer className="modal-actions"><button type="button" className="cancel-button" onClick={onClose}>إلغاء</button><button className="add-button" type="submit" disabled={!amount || !reference.trim() || settlement?.status !== 'confirmed'}>تسجيل التحويل</button></footer>
    </form>
  </AppDialog>
}
