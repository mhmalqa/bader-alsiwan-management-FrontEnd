'use client'

import { useState } from 'react'
import { bankMatches, bankTransactions, companyBankAccounts, payments } from '@/mocks/data'
import { matchBankTransaction } from '@/services/operations'

const money = (value: number) => `${new Intl.NumberFormat('ar-SA').format(value)} ر.س`

export function BankReconciliationPage() {
  const [version, setVersion] = useState(0)
  const [selectedTransactionId, setSelectedTransactionId] = useState(bankTransactions.find((item) => item.status !== 'matched')?.id ?? bankTransactions[0]?.id ?? '')
  const [paymentId, setPaymentId] = useState('')
  const [amount, setAmount] = useState('')
  const [notice, setNotice] = useState('')
  const transaction = bankTransactions.find((item) => item.id === selectedTransactionId)
  const matchedAmount = bankMatches.filter((item) => item.bankTransactionId === selectedTransactionId).reduce((sum, item) => sum + item.amount, 0)
  const remaining = Math.max(0, (transaction?.amount ?? 0) - matchedAmount)
  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    try { await matchBankTransaction({ bankTransactionId: selectedTransactionId, paymentId, amount: Number(amount) }); setNotice('تمت المطابقة البنكية وتحديث حالة الحركة.'); setPaymentId(''); setAmount(''); setVersion((value) => value + 1) } catch (reason) { setNotice(reason instanceof Error ? reason.message : 'تعذرت المطابقة.') }
  }
  void version
  return <div className="content"><div className="module-title"><div><span className="overline">البنك والتحصيل</span><h1>المطابقة البنكية</h1><p>اربط الحوالة الواردة بدفعة مستأجر أو الحوالة الصادرة بتحويل مالك، ولا تتجاوز المبلغ المتبقي في حركة البنك.</p></div></div><section className="financial-grid">{companyBankAccounts.map((account) => <span key={account.id}>الحساب <b>{account.bankName} · {account.ibanMasked}</b></span>)}<span>حركات غير مطابقة <b>{bankTransactions.filter((item) => item.status !== 'matched').length}</b></span><span>قيمة غير مطابقة <b>{money(bankTransactions.filter((item) => item.status !== 'matched').reduce((sum, item) => sum + item.amount - bankMatches.filter((match) => match.bankTransactionId === item.id).reduce((matched, match) => matched + match.amount, 0), 0))}</b></span></section><section className="card entity-form"><label className="full-width">حركة البنك<select value={selectedTransactionId} onChange={(event) => { setSelectedTransactionId(event.target.value); setPaymentId(''); setAmount(''); setNotice('') }}>{bankTransactions.map((item) => <option key={item.id} value={item.id}>{item.bookedDate} · {item.direction === 'inbound' ? 'وارد' : 'صادر'} · {money(item.amount)} · {item.externalReference} · {item.status}</option>)}</select></label>{transaction && <div className="full-width financial-grid"><span>مرجع البنك <b>{transaction.externalReference}</b></span><span>المطابق سابقاً <b>{money(matchedAmount)}</b></span><span>المتبقي للمطابقة <b>{money(remaining)}</b></span></div>}<form className="full-width entity-form" onSubmit={submit}><label>الدفعة المسجلة<select required value={paymentId} onChange={(event) => { setPaymentId(event.target.value); const payment = payments.find((item) => item.id === event.target.value); if (payment) setAmount(String(Math.min(payment.amount, remaining))) }}><option value="">اختر الدفعة</option>{payments.filter((item) => item.status === 'confirmed').map((payment) => <option key={payment.id} value={payment.id}>{payment.paymentNumber} · {money(payment.amount)} · {payment.transactionReference ?? 'بدون مرجع'}</option>)}</select></label><label>مبلغ المطابقة<input required type="number" min="0.01" max={remaining} value={amount} onChange={(event) => setAmount(event.target.value)} /></label><div className="form-actions"><button className="add-button" type="submit" disabled={!selectedTransactionId || !paymentId || !Number(amount)}>تأكيد المطابقة</button></div></form>{notice && <p className={notice.startsWith('تمت') ? 'success-message full-width' : 'error-message full-width'}>{notice}</p>}</section></div>
}
