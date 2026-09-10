import { payments, receivables, settlements } from '@/mocks/data'
import type { Payment, OwnerTransfer, Receivable } from '@/types/domain'
import { logAudit } from '@/services/frontend-store'
export async function recordPayment(input: Omit<Payment, 'id' | 'paymentNumber' | 'status'>): Promise<Payment> {
  const receivable = receivables.find((item) => item.id === input.receivableId)
  if (!receivable) throw new Error('الاستحقاق غير موجود.')
  if (input.amount <= 0 || input.amount > receivable.remainingAmount) throw new Error('مبلغ الدفعة يجب ألا يتجاوز الرصيد المتبقي.')
  const payment: Payment = { ...input, id: crypto.randomUUID(), paymentNumber: `PAY-${String(payments.length + 1).padStart(3, '0')}`, status: 'confirmed', currency: input.currency ?? 'SAR', createdAt: new Date().toISOString(), createdBy: 'مدير النظام' }
  payments.push(payment); receivable.paidAmount += input.amount; receivable.remainingAmount = Math.max(0, receivable.originalAmount - receivable.paidAmount); receivable.status = receivable.remainingAmount === 0 ? 'paid' : 'partially_paid'; logAudit('تسجيل', 'دفعة', payment.id, `دفعة ${payment.paymentNumber} بقيمة ${payment.amount} للاستحقاق ${receivable.id}`); return payment
}
export async function reversePayment(paymentId: string, reason: string): Promise<Payment | undefined> {
  const payment = payments.find((item) => item.id === paymentId)
  if (!payment || payment.status === 'reversed' || reason.trim().length < 5) return undefined
  if (settlements.some((item) => item.paymentIds?.includes(paymentId))) throw new Error('لا يمكن عكس دفعة تم إدراجها ضمن تسوية. أنشئ تسوية تصحيحية أولاً.')
  payment.status = 'reversed'; const receivable = receivables.find((item) => item.id === payment.receivableId); if (receivable) { receivable.paidAmount = Math.max(0, receivable.paidAmount - payment.amount); receivable.remainingAmount = receivable.originalAmount - receivable.paidAmount; receivable.status = receivable.paidAmount === 0 ? 'upcoming' : 'partially_paid' }; logAudit('عكس', 'دفعة', payment.id, `عكس الدفعة ${payment.paymentNumber}: ${reason.trim()}`); return payment
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
