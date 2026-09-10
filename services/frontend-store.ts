import { bankMatches, bankTransactions, companyBankAccounts, expenses, leases, managementContracts, owners, paymentAllocations, payments, properties, receivables, settlements, tenants, units } from '@/mocks/data'
import { attachmentsData } from '@/mocks/attachments-data'
import { collectionFollowUps, communicationLogs, generatedDocuments, maintenanceRequests, remindersData } from '@/mocks/operations-data'
import type { AuditLog } from '@/types/domain'

const key = 'bader-alsiwan.frontend-data.v1'
export const auditLogs: AuditLog[] = []
const collections = { owners, properties, units, tenants, leases, receivables, payments, paymentAllocations, companyBankAccounts, bankTransactions, bankMatches, expenses, managementContracts, settlements, attachmentsData, maintenanceRequests, remindersData, collectionFollowUps, communicationLogs, generatedDocuments, auditLogs }
type CollectionKey = keyof typeof collections

export function persistFrontendData() { if (typeof window === 'undefined') return; localStorage.setItem(key, JSON.stringify(collections)) }
export function hydrateFrontendData() {
  if (typeof window === 'undefined') return
  try { const saved = JSON.parse(localStorage.getItem(key) ?? '{}') as Partial<Record<CollectionKey, unknown[]>>; (Object.keys(collections) as CollectionKey[]).forEach((name) => { const source = saved[name]; if (Array.isArray(source)) collections[name].splice(0, collections[name].length, ...source as never[]) }) } catch { localStorage.removeItem(key) }
}
export function logAudit(action: string, entity: string, entityId: string, changesSummary: string) { auditLogs.unshift({ id: crypto.randomUUID(), timestamp: new Date().toISOString(), user: 'مدير النظام', action, entity, entityId, changesSummary }); persistFrontendData() }
