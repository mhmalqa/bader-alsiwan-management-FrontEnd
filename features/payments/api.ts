import { api } from '@/lib/api/http'

export type Payment = { id: string; number: string; tenantId: string; receiptDate: string; postingDate?: string | null; paymentMethod: string; amount: number; currency: string; transactionReference?: string | null; status: 'confirmed' | 'reversed'; allocations: { receivableId: string; amount: number }[] }
export type Receivable = { id: string; tenantId: string; tenantName?: string | null; leaseId?: string | null; leaseNumber?: string | null; propertyId?: string | null; propertyName?: string | null; spaceId?: string | null; spaceName?: string | null; installmentNumber?: number | null; dueDate: string; originalAmount: number; paidAmount: number; balance: number; status: string }
export const listPayments = () => api<{ items: Payment[] }>('/payments')
export const listOpenReceivables = () => api<{ items: Receivable[] }>('/receivables')
export const createPayment = (payload: { tenantId: string; receiptDate: string; postingDate?: string; paymentMethod: string; amount: number; currency: string; transactionReference?: string; allocations: { receivableId: string; amount: number }[] }) => api<Payment>('/payments', { method: 'POST', headers: { 'Idempotency-Key': crypto.randomUUID() }, body: JSON.stringify(payload) })
export const reversePayment = (id: string, reason: string) => api<Payment>(`/payments/${id}/reverse`, { method: 'POST', body: JSON.stringify({ reason }) })
