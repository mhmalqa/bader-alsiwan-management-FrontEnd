import { bankMatches, bankTransactions, paymentAllocations, payments, receivables, settlements } from '@/mocks/data'
import type { Payment, OwnerTransfer, PaymentAllocation, Receivable } from '@/types/domain'
import { logAudit } from '@/services/frontend-store'
export async function recordPayment(input: Omit<Payment, 'id' | 'paymentNumber' | 'status'>): Promise<Payment> {
  const receivable = receivables.find((item) => item.id === input.receivableId)
  if (!receivable) throw new Error('الاستحقاق غير موجود.')
  if (input.amount <= 0 || input.amount > receivable.remainingAmount) throw new Error('مبلغ الدفعة يجب ألا يتجاوز الرصيد المتبقي.')
  const payment: Payment = { ...input, id: crypto.randomUUID(), paymentNumber: `PAY-${String(payments.length + 1).padStart(3, '0')}`, status: 'confirmed', currency: input.currency ?? 'SAR', createdAt: new Date().toISOString(), createdBy: 'مدير النظام' }
  payments.push(payment); paymentAllocations.push({ id: crypto.randomUUID(), paymentId: payment.id, receivableId: receivable.id, amount: input.amount, createdAt: new Date().toISOString(), createdBy: payment.createdBy ?? 'مدير النظام' }); receivable.paidAmount += input.amount; receivable.remainingAmount = Math.max(0, receivable.originalAmount - receivable.paidAmount); receivable.status = receivable.remainingAmount === 0 ? 'paid' : 'partially_paid'; logAudit('تسجيل', 'دفعة', payment.id, `دفعة ${payment.paymentNumber} بقيمة ${payment.amount} للاستحقاق ${receivable.id}`); return payment
}
export async function recordAllocatedPayment(input: Omit<Payment, 'id' | 'paymentNumber' | 'status' | 'receivableId' | 'leaseId' | 'propertyId' | 'unitId'> & { allocations: Array<{ receivableId: string; amount: number }> }): Promise<Payment> {
  const allocations = input.allocations.filter((item) => item.amount > 0)
  if (!allocations.length) throw new Error('أضف استحقاقاً واحداً على الأقل.')
  const total = allocations.reduce((sum, item) => sum + item.amount, 0)
  if (total !== input.amount) throw new Error('يجب أن يساوي مجموع التوزيعات مبلغ الدفعة.')
  const targets = allocations.map((item) => ({ item, receivable: receivables.find((record) => record.id === item.receivableId) }))
  if (targets.some((target) => !target.receivable || target.item.amount > (target.receivable?.remainingAmount ?? 0))) throw new Error('أحد التوزيعات يتجاوز الرصيد المتبقي.')
  const first = targets[0].receivable!
  const payment: Payment = { ...input, id: crypto.randomUUID(), paymentNumber: `PAY-${String(payments.length + 1).padStart(3, '0')}`, receivableId: first.id, leaseId: first.leaseId, propertyId: first.propertyId, unitId: first.unitId, status: 'confirmed', currency: input.currency ?? 'SAR', createdAt: new Date().toISOString(), createdBy: 'مدير النظام' }
  payments.push(payment)
  targets.forEach(({ item, receivable }) => { const target = receivable!; paymentAllocations.push({ id: crypto.randomUUID(), paymentId: payment.id, receivableId: target.id, amount: item.amount, createdAt: payment.createdAt!, createdBy: payment.createdBy! }); target.paidAmount += item.amount; target.remainingAmount = Math.max(0, target.originalAmount - target.paidAmount); target.status = target.remainingAmount === 0 ? 'paid' : 'partially_paid' })
  logAudit('تسجيل', 'دفعة موزعة', payment.id, `دفعة ${payment.paymentNumber} موزعة على ${allocations.length} استحقاقات`)
  return payment
}
export async function matchBankTransaction(input: { bankTransactionId: string; paymentId?: string; ownerTransferId?: string; amount: number }) {
  const transaction = bankTransactions.find((item) => item.id === input.bankTransactionId)
  if (!transaction || (!input.paymentId && !input.ownerTransferId) || input.amount <= 0) throw new Error('بيانات المطابقة غير صحيحة.')
  const alreadyMatched = bankMatches.filter((item) => item.bankTransactionId === transaction.id).reduce((sum, item) => sum + item.amount, 0)
  if (alreadyMatched + input.amount > transaction.amount) throw new Error('قيمة المطابقة تتجاوز حركة البنك.')
  const match = { id: crypto.randomUUID(), ...input, matchedAt: new Date().toISOString(), matchedBy: 'مدير النظام' }
  bankMatches.push(match); transaction.status = alreadyMatched + input.amount === transaction.amount ? 'matched' : 'partially_matched'; logAudit('مطابقة', 'حركة بنكية', transaction.id, `مطابقة بقيمة ${input.amount}`); return match
}
export async function reversePayment(paymentId: string, reason: string): Promise<Payment | undefined> {
  const payment = payments.find((item) => item.id === paymentId)
  if (!payment || payment.status === 'reversed' || reason.trim().length < 5) return undefined
  if (settlements.some((item) => item.paymentIds?.includes(paymentId))) throw new Error('لا يمكن عكس دفعة تم إدراجها ضمن تسوية. أنشئ تسوية تصحيحية أولاً.')
  payment.status = 'reversed'; const today = new Date().toISOString().slice(0, 10); paymentAllocations.filter((allocation) => allocation.paymentId === payment.id).forEach((allocation) => { const receivable = receivables.find((item) => item.id === allocation.receivableId); if (!receivable) return; receivable.paidAmount = Math.max(0, receivable.paidAmount - allocation.amount); receivable.remainingAmount = receivable.originalAmount - receivable.paidAmount; receivable.status = receivable.remainingAmount === 0 ? 'paid' : receivable.dueDate < today ? 'overdue' : receivable.paidAmount > 0 ? 'partially_paid' : 'upcoming' }); logAudit('عكس', 'دفعة', payment.id, `عكس الدفعة ${payment.paymentNumber}: ${reason.trim()}`); return payment
}
export async function recordOwnerTransfer(settlementId: string, transfer: Omit<OwnerTransfer, 'id'>) {
  const settlement = settlements.find((item) => item.id === settlementId)
  if (!settlement || settlement.status !== 'confirmed' || transfer.amount <= 0 || transfer.amount > settlement.remainingBalance || !transfer.transactionReference.trim()) return undefined
  const item: OwnerTransfer = { ...transfer, id: crypto.randomUUID(), currency: 'SAR', createdAt: new Date().toISOString(), createdBy: 'مدير النظام' }; settlement.transfers.push(item); settlement.transferAmount += item.amount; settlement.remainingBalance = Math.max(0, settlement.netDueToOwner - settlement.transferAmount); logAudit('تسجيل', 'تحويل مالك', item.id, `تحويل ${item.amount} للتسوية ${settlement.settlementNumber}`); return settlement
}
export async function createManualReceivable(input: { leaseId: string; dueDate: string; amount: number; installmentNumber: number }): Promise<Receivable> {
  const lease = (await import('@/mocks/data')).leases.find((item) => item.id === input.leaseId)
  if (!lease || lease.status !== 'active') throw new Error('اختر عقد إيجار نشطاً.')
  if (!input.dueDate || input.dueDate < lease.startDate || input.dueDate > lease.endDate) throw new Error('يجب أن يكون تاريخ الاستحقاق ضمن مدة العقد.')
  if (input.amount <= 0 || !Number.isFinite(input.amount)) throw new Error('أدخل مبلغ استحقاق صحيحاً.')
  if (receivables.some((item) => item.leaseId === lease.id && item.installmentNumber === input.installmentNumber)) throw new Error('رقم القسط مستخدم مسبقاً في هذا العقد.')
  const record: Receivable = { id: `REC-${crypto.randomUUID()}`, leaseId: lease.id, tenantId: lease.tenantId, propertyId: lease.propertyId, unitId: lease.unitId, installmentNumber: input.installmentNumber, dueDate: input.dueDate, originalAmount: input.amount, paidAmount: 0, remainingAmount: input.amount, status: 'upcoming' }
  receivables.push(record); logAudit('إنشاء', 'استحقاق', record.id, `استحقاق القسط ${record.installmentNumber} للعقد ${lease.internalContractNumber} بقيمة ${record.originalAmount}`); return record
}
