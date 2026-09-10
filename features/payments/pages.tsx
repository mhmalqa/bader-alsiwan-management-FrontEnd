'use client'

import Link from 'next/link'
import { BadgeCheck, CheckCircle2, CircleDollarSign, ReceiptText, RotateCcw, WalletCards } from 'lucide-react'
import { useState } from 'react'
import { AppDialog } from '@/components/shared/app-dialog'
import { DataTable } from '@/components/shared/data-table'
import { leases, payments, properties, receivables, tenants, units } from '@/mocks/data'
import { recordPayment, reversePayment } from '@/services/operations'

const money = (amount: number) => `${new Intl.NumberFormat('ar-SA').format(amount)} ر.س`
const methodLabel: Record<string, string> = { bank_transfer: 'تحويل بنكي', cash: 'نقداً', cheque: 'شيك', card: 'بطاقة', other: 'أخرى' }

export function PaymentsPage() {
  const [version, setVersion] = useState(0)
  const [reversing, setReversing] = useState<(typeof payments)[number] | null>(null)
  const [reason, setReason] = useState('')

  const confirmed = payments.filter((item) => item.status === 'confirmed')
  const summary = {
    collected: confirmed.reduce((sum, item) => sum + item.amount, 0),
    count: confirmed.length,
    reversed: payments.filter((item) => item.status === 'reversed').length,
    linkedInstallments: new Set(confirmed.map((item) => item.receivableId)).size,
  }

  const confirmReversal = async () => {
    if (!reversing || !reason.trim()) return
    await reversePayment(reversing.id, reason)
    setReversing(null)
    setReason('')
    setVersion((current) => current + 1)
  }

  return <main className="payment-collection page-stack">
    <section className="module-header collection-header">
      <div>
        <span className="eyebrow"><WalletCards size={15} /> التحصيل المالي</span>
        <h1>دفعات المستأجرين والتحصيلات</h1>
        <p>سجل المبالغ المستلمة من المستأجرين مقابل أقساط عقود الإيجار. لا يشمل هذا السجل تحويلات المبالغ إلى الملاك.</p>
      </div>
      <Link href="/payments/new" className="add-button"><WalletCards size={17} /> تسجيل دفعة مستأجر</Link>
    </section>

    <section className="collection-explainer" aria-label="توضيح مسار التحصيل">
      <span className="explainer-step">1. تستلم الدفعة من المستأجر</span><span>←</span>
      <span className="explainer-step">2. ترتبط بالقسط والعقد والعقار</span><span>←</span>
      <span className="explainer-step highlighted">3. تظهر ضمن تسوية المالك للتحويل</span>
    </section>

    <section className="collection-stats" aria-label="ملخص التحصيل المالي">
      <article className="collection-kpi collections-total"><div className="kpi-icon"><CircleDollarSign size={23} /></div><div className="kpi-copy"><span>إجمالي التحصيلات المؤكدة</span><strong>{money(summary.collected)}</strong><small>المبالغ الجاهزة للدخول في التسويات</small></div><div className="kpi-trend"><BadgeCheck size={15} /> موثّق</div></article>
      <article className="collection-kpi collections-confirmed"><div className="kpi-icon"><ReceiptText size={22} /></div><div className="kpi-copy"><span>دفعات مؤكدة</span><strong>{summary.count}</strong><small>مرتبطة بـ {summary.linkedInstallments} {summary.linkedInstallments === 1 ? 'قسط' : 'أقساط'}</small></div><div className="kpi-trend"><BadgeCheck size={15} /> نشطة</div></article>
      <article className="collection-kpi collections-reversed"><div className="kpi-icon"><RotateCcw size={21} /></div><div className="kpi-copy"><span>دفعات ملغاة أو معكوسة</span><strong>{summary.reversed}</strong><small>مستبعدة تلقائياً من تسوية المالك</small></div><div className="kpi-trend">سجل محفوظ</div></article>
    </section>

    <DataTable key={version} rows={payments} columns={[
      { key: 'paymentNumber', title: 'رقم الإيصال' },
      { key: 'tenantId', title: 'المستأجر' },
      { key: 'propertyId', title: 'العقار' },
      { key: 'unitId', title: 'الوحدة' },
      { key: 'leaseId', title: 'عقد الإيجار' },
      { key: 'receivableId', title: 'القسط المستحق', render: (value) => { const receivable = receivables.find((item) => item.id === value); return receivable ? `القسط ${receivable.installmentNumber} · ${receivable.dueDate}` : String(value) } },
      { key: 'amount', title: 'المبلغ المستلم', render: (value) => money(Number(value)) },
      { key: 'paymentMethod', title: 'طريقة الدفع', render: (value) => methodLabel[String(value)] ?? String(value) },
      { key: 'paymentDate', title: 'تاريخ الاستلام' },
      { key: 'status', title: 'الحالة', render: (value) => <span className={`status-badge ${value === 'confirmed' ? 'success' : 'danger'}`}>{value === 'confirmed' ? 'مؤكدة' : 'ملغاة'}</span> },
      { key: 'id', title: 'الإجراء', render: (_, row) => row.status === 'confirmed' ? <button className="table-action danger-action" onClick={() => setReversing(row)}><RotateCcw size={15} /> عكس الدفعة</button> : '—' },
    ]} />

    <AppDialog open={Boolean(reversing)} onClose={() => { setReversing(null); setReason('') }} title="عكس دفعة مستأجر" description="سيتم إعادة القسط إلى حالته السابقة وإزالة هذه الدفعة من إجمالي التحصيلات المؤكدة.">
      <div className="payment-reversal">
        {reversing && <div className="reversal-summary"><span>الإيصال: <b>{reversing.paymentNumber}</b></span><span>المبلغ: <b>{money(reversing.amount)}</b></span></div>}
        <label>سبب عكس الدفعة <em>*</em><textarea value={reason} onChange={(event) => setReason(event.target.value)} placeholder="مثال: تم تسجيل الدفعة على قسط غير صحيح" /></label>
        <div className="modal-actions"><button className="secondary-button" onClick={() => { setReversing(null); setReason('') }}>إلغاء</button><button className="danger-button" disabled={!reason.trim()} onClick={confirmReversal}><RotateCcw size={16} /> تأكيد عكس الدفعة</button></div>
      </div>
    </AppDialog>
  </main>
}

export function PaymentFormPage() {
  const [receivableId, setReceivableId] = useState(receivables.find((item) => item.remainingAmount > 0)?.id ?? '')
  const [amount, setAmount] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<'bank_transfer' | 'cash' | 'cheque' | 'card' | 'other'>('bank_transfer')
  const [reference, setReference] = useState('')
  const [chequeNumber, setChequeNumber] = useState('')
  const [chequeBank, setChequeBank] = useState('')
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)
  const selected = receivables.find((item) => item.id === receivableId)
  const save = async () => {
    if (!selected || !Number(amount) || Number(amount) > selected.remainingAmount) return
    if ((paymentMethod === 'bank_transfer' || paymentMethod === 'cheque') && !reference.trim()) { setError('مرجع العملية مطلوب للتحويل أو الشيك.'); return }
    if (paymentMethod === 'cheque' && (!chequeNumber.trim() || !chequeBank.trim())) { setError('رقم الشيك والبنك مطلوبان.'); return }
    try { await recordPayment({ tenantId: selected.tenantId, leaseId: selected.leaseId, receivableId: selected.id, propertyId: selected.propertyId, unitId: selected.unitId, amount: Number(amount), paymentDate: new Date().toISOString().slice(0, 10), paymentMethod, transactionReference: reference.trim() || undefined, chequeNumber: chequeNumber.trim() || undefined, chequeBank: chequeBank.trim() || undefined }); setSaved(true); setError('') } catch (message) { setError(message instanceof Error ? message.message : 'تعذر تسجيل الدفعة.') }
  }
  return <main className="page-stack"><section className="module-header"><div><span className="eyebrow">التحصيل المالي</span><h1>تسجيل دفعة مستأجر</h1><p>اختر القسط المستحق أولاً؛ سيظهر العقد والمستأجر والعقار تلقائياً ضمن الدفعة.</p></div></section><section className="card form-card payment-entry-form">
    <label>القسط المستحق<select value={receivableId} onChange={(event) => { setReceivableId(event.target.value); setAmount(''); setSaved(false) }}><option value="">اختر القسط</option>{receivables.filter((item) => item.remainingAmount > 0).map((item) => <option key={item.id} value={item.id}>القسط {item.installmentNumber} — {item.dueDate} — المتبقي {money(item.remainingAmount)}</option>)}</select></label>
    {selected && <div className="payment-context"><span>المستأجر: <b>{tenants.find((item) => item.id === selected.tenantId)?.fullName}</b></span><span>العقار: <b>{properties.find((item) => item.id === selected.propertyId)?.propertyName}</b></span><span>الوحدة: <b>{units.find((item) => item.id === selected.unitId)?.unitNameOrNumber}</b></span><span>العقد: <b>{leases.find((item) => item.id === selected.leaseId)?.internalContractNumber}</b></span><span>المتبقي: <b>{money(selected.remainingAmount)}</b></span></div>}
    <label>المبلغ المستلم (ر.س)<input type="number" min="1" max={selected?.remainingAmount} value={amount} onChange={(event) => setAmount(event.target.value)} /></label><label>طريقة الدفع<select value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value as typeof paymentMethod)}>{Object.entries(methodLabel).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
    {(paymentMethod === 'bank_transfer' || paymentMethod === 'cheque') && <label>مرجع العملية <input value={reference} onChange={(event) => setReference(event.target.value)} placeholder="رقم الحوالة أو المرجع البنكي" /></label>}{paymentMethod === 'cheque' && <><label>رقم الشيك <input value={chequeNumber} onChange={(event) => setChequeNumber(event.target.value)} /></label><label>بنك الشيك <input value={chequeBank} onChange={(event) => setChequeBank(event.target.value)} /></label></>}
    {error && <p className="error-message">{error}</p>}{saved && <p className="form-success"><CheckCircle2 size={17} /> تم تسجيل الدفعة وربطها بالقسط المختار.</p>}<button className="primary-button" onClick={save} disabled={!selected || !Number(amount) || Number(amount) > selected.remainingAmount}>تأكيد تسجيل الدفعة</button>
  </section></main>
}
