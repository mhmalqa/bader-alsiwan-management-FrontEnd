import { api } from '@/lib/api/http'

export type BankMatch = { id: string; bankTransactionId: string; paymentId?: string | null; amount: number; matchedAt: string }
export type BankTransaction = { id: string; bankAccountId: string; bookedDate: string; valueDate?: string | null; amount: number; direction: 'inbound' | 'outbound'; externalReference: string; status: 'unmatched' | 'partially_matched' | 'matched'; matchedAmount: number; remainingAmount: number; matches: BankMatch[] }
export type CompanyBankAccount = { id: string; bankName: string; accountName: string; iban: string; status: string }
export const listBankAccounts = () => api<{ items: CompanyBankAccount[] }>('/company-bank-accounts?active=true')
export const listBankTransactions = (status?: string) => api<{ items: BankTransaction[] }>(`/bank-transactions${status ? `?status=${encodeURIComponent(status)}` : ''}`)
export const createBankMatch = (payload: { bankTransactionId: string; paymentId: string; amount: number }) => api<BankMatch>('/bank-matches', { method: 'POST', body: JSON.stringify(payload) })
export const deleteBankMatch = (id: string, reason: string) => api<void>(`/bank-matches/${id}`, { method: 'DELETE', body: JSON.stringify({ reason }) })
