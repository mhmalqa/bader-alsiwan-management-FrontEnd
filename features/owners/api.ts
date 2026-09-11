import { api } from '@/lib/api/http'

export type BankAccount = { id: string; bankName: string; iban: string; accountHolderName: string; isDefault: boolean; status: string; version: number }
export type Owner = { id: string; ownerCode: string; fullName: string; nationalIdOrIqama: string; mobilePrimary: string; email?: string | null; city: string; district?: string | null; status: 'active' | 'inactive' | 'archived'; version: number; bankAccounts?: BankAccount[] }
export type OwnerPortfolio = { owner: Owner; properties: { id: string; propertyCode: string; propertyName: string; city: string; spacesCount: number; expectedAnnualRent: string }[]; summary: { expectedAnnualRent: string; propertiesCount: number; spacesCount: number } }
export const listOwners = () => api<{ items: Owner[] }>('/owners')
export const getOwner = (id: string) => api<Owner>(`/owners/${id}`)
export const getOwnerPortfolio = (id: string) => api<OwnerPortfolio>(`/owners/${id}/portfolio`)
export const createOwner = (payload: Omit<Owner, 'id' | 'version' | 'status'> & { status?: Owner['status'] }) => api<Owner>('/owners', { method: 'POST', body: JSON.stringify(payload) })
export const updateOwner = (id: string, payload: Partial<Omit<Owner, 'id'>> & { version: number }) => api<Owner>(`/owners/${id}`, { method: 'PATCH', body: JSON.stringify(payload) })
export const createOwnerBankAccount = (ownerId: string, payload: { bankName: string; iban: string; accountHolderName: string; isDefault?: boolean }) => api<BankAccount>(`/owners/${ownerId}/bank-accounts`, { method: 'POST', body: JSON.stringify(payload) })
