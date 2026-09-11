'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { confirmSettlement, createTransfer, getSettlement, listSettlements, type Settlement } from './api'

const money = (value: number) => `${new Intl.NumberFormat('ar-SA').format(value)} ر.س`

export function SettlementsPage() {
  const [items, setItems] = useState<Settlement[]>([])
  const [error, setError] = useState('')
  useEffect(() => { void listSettlements().then(({ items }) => setItems(items)).catch(error => setError(error instanceof Error ? error.message : 'تعذر التحميل.')) }, [])
  return <div className="content"><div className="module-title"><div><span className="overline">تسويات الملاك</span><h1>تسويات الملاك</h1><p>الأرصدة والتحويلات من الخادم.</p></div><Link className="add-button" href="/owner-settlements/new">إنشاء تسوية</Link></div>{error && <p className="error-message">{error}</p>}<section className="card table-card"><div className="table-wrap"><table><thead><tr><th>الرقم</th><th>المحصلات</th><th>الصافي</th><th>المحول</th><th>المتبقي</th><th /></tr></thead><tbody>{items.map(item => <tr key={item.id}><td>{item.number}</td><td>{money(item.grossCollections)}</td><td>{money(item.netDue)}</td><td>{money(item.transferAmount)}</td><td>{money(item.remainingBalance)}</td><td><Link className="cancel-button" href={`/owner-settlements/${item.id}`}>تفاصيل</Link></td></tr>)}</tbody></table></div></section></div>
}

export function SettlementDetailPage({ id }: { id: string }) {
  const [settlement, setSettlement] = useState<Settlement>()
  const [error, setError] = useState('')
  const [confirming, setConfirming] = useState(false)
  const reload = async () => setSettlement(await getSettlement(id))
  useEffect(() => { const timer = setTimeout(() => void getSettlement(id).then(setSettlement).catch(error => setError(error instanceof Error ? error.message : 'تعذر تحميل التسوية.')), 0); return () => clearTimeout(timer) }, [id])
  const confirm = async () => {
    setConfirming(true); setError('')
    try { await confirmSettlement(id); await reload() } catch (error) { setError(error instanceof Error ? error.message : 'تعذر تأكيد التسوية.') } finally { setConfirming(false) }
  }
  if (error && !settlement) return <div className="content"><p className="error-message">{error}</p></div>
  if (!settlement) return <div className="content"><p>جارٍ تحميل التسوية…</p></div>
  return <div className="content"><div className="module-title"><div><span className="overline">تفاصيل التسوية</span><h1>{settlement.number}</h1><p>{settlement.fromDate} — {settlement.toDate}</p></div><div className="inline-actions">{settlement.status === 'draft' && <button className="add-button" type="button" disabled={confirming} onClick={confirm}>{confirming ? 'جارٍ التأكيد…' : 'تأكيد التسوية'}</button>}{settlement.status === 'confirmed' && <Link className="add-button" href={`/owner-settlements/${id}/transfers/new`}>تسجيل تحويل</Link>}</div></div>{error && <p className="error-message">{error}</p>}<section className="card settlement-breakdown"><div><span>إجمالي المحصلات</span><b>{money(settlement.grossCollections)}</b></div><div><span>أتعاب الإدارة</span><b>{money(settlement.managementFees)}</b></div><div><span>مصروفات المالك</span><b>{money(settlement.ownerExpenses)}</b></div><div className="total"><span>صافي المستحق</span><b>{money(settlement.netDue)}</b></div><div className="total"><span>المتبقي</span><b>{money(settlement.remainingBalance)}</b></div></section><section className="card"><h2>سجل التحويلات</h2>{settlement.transfers.length ? settlement.transfers.map(transfer => <p key={transfer.id}>{money(transfer.amount)} — {transfer.transferDate} — {transfer.transactionReference}</p>) : <p>لا توجد تحويلات.</p>}</section></div>
}

export function SettlementFormPage({ id }: { id: string }) {
  const [settlement, setSettlement] = useState<Settlement>()
  const [banks, setBanks] = useState<{ id: string; bankName: string; iban: string }[]>([])
  const [bankId, setBankId] = useState(''); const [amount, setAmount] = useState(''); const [reference, setReference] = useState('')
  const [error, setError] = useState(''); const [saving, setSaving] = useState(false)
  useEffect(() => { void getSettlement(id).then(async settlement => { setSettlement(settlement); const { getOwner } = await import('@/features/owners/api'); const owner = await getOwner(settlement.ownerId); setBanks(owner.bankAccounts ?? []) }).catch(error => setError(error instanceof Error ? error.message : 'تعذر التحميل.')) }, [id])
  const save = async (event: React.FormEvent) => { event.preventDefault(); setSaving(true); setError(''); try { await createTransfer(id, { ownerBankAccountId: bankId, amount: Number(amount), transferDate: new Date().toISOString().slice(0, 10), transactionReference: reference }); setSettlement(await getSettlement(id)); setAmount(''); setReference('') } catch (error) { setError(error instanceof Error ? error.message : 'تعذر تسجيل التحويل.') } finally { setSaving(false) } }
  if (!settlement) return <div className="content"><p>{error || 'جارٍ تحميل التسوية…'}</p></div>
  if (settlement.status !== 'confirmed') return <div className="content"><p className="error-message">يجب تأكيد التسوية قبل تسجيل التحويل.</p></div>
  return <div className="content"><h1>تسجيل تحويل للمالك</h1><form className="card entity-form" onSubmit={save}><label>حساب المالك<select required value={bankId} disabled={saving} onChange={event => setBankId(event.target.value)}><option value="">اختر الحساب</option>{banks.map(bank => <option key={bank.id} value={bank.id}>{bank.bankName} · {bank.iban}</option>)}</select></label><label>المبلغ<input required type="number" min="0.01" max={settlement.remainingBalance} value={amount} disabled={saving} onChange={event => setAmount(event.target.value)} /></label><label>المرجع<input required value={reference} disabled={saving} onChange={event => setReference(event.target.value)} /></label><p>المتبقي: {money(settlement.remainingBalance)}</p>{error && <p className="error-message">{error}</p>}<button className="add-button" type="submit" disabled={saving || !bankId || !amount || !reference}>{saving ? 'جارٍ الحفظ…' : 'تسجيل التحويل'}</button></form></div>
}
