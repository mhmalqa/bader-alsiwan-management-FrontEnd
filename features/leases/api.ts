import { api } from '@/lib/api/http'
export type Lease = { id:string; internalNumber:string; tenantId:string; startDate:string; endDate:string; annualRent:number; totalValue:number; currency:string; frequency:string; status:string; version:number }
export type LeaseDetail = Lease & { spaces:{spaceId:string;spaceName:string;propertyId:string;propertyName:string;startDate:string;endDate:string}[];installments:{id:string;sequenceNo:number;dueDate:string;amount:number;notes?:string|null}[] }
export const listLeases=()=>api<{items:Lease[]}>('/leases')
export const getLease=(id:string)=>api<LeaseDetail>(`/leases/${id}`)
export const createLease=(payload:{internalNumber:string;tenantId:string;startDate:string;endDate:string;annualRent:number;totalValue:number;frequency:string;spaces:{spaceId:string;startDate:string;endDate:string}[];installments:{dueDate:string;amount:number}[]})=>api<Lease>('/leases',{method:'POST',body:JSON.stringify(payload)})
export const updateLease=(id:string,payload:{version:number;internalNumber:string;tenantId:string;startDate:string;endDate:string;annualRent:number;totalValue:number;frequency:string;spaces:{spaceId:string;startDate:string;endDate:string}[];installments:{dueDate:string;amount:number}[]})=>api<Lease>(`/leases/${id}`,{method:'PATCH',body:JSON.stringify(payload)})
