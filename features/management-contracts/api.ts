import { api } from '@/lib/api/http'
export type ManagementContract = { id: string; contractNumber: string; ownerId: string; startDate: string; endDate: string; feeMethod: string; percentRate?: number | null; fixedAmount?: number | null; approvalThreshold?: number | null; status: string; version: number; scopes: { propertyId: string; spaceId?: string | null }[]; services: { code: string; notes?: string | null }[]; exclusions: { code: string; notes?: string | null }[] }
export const listManagementContracts = () => api<{ items: ManagementContract[] }>('/management-contracts')
export const getManagementContract = (id: string) => api<ManagementContract>(`/management-contracts/${id}`)
export const createManagementContract=(payload:Omit<ManagementContract,'id'|'status'|'version'>)=>api<ManagementContract>('/management-contracts',{method:'POST',body:JSON.stringify(payload)})
export const updateManagementContract=(id:string,payload:Omit<ManagementContract,'id'|'status'>)=>api<ManagementContract>(`/management-contracts/${id}`,{method:'PATCH',body:JSON.stringify(payload)})
