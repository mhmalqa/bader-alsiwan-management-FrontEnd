import {api}from '@/lib/api/http'
export type Tenant={id:string;tenantCode:string;fullName:string;nationalIdOrIqama:string;mobilePrimary:string;email?:string|null;status:string;version:number}
export const listTenants=()=>api<{items:Tenant[]}>('/tenants')
export const getTenant=(id:string)=>api<Tenant>(`/tenants/${id}`)
export const createTenant=(p:Omit<Tenant,'id'|'status'|'version'>)=>api<Tenant>('/tenants',{method:'POST',body:JSON.stringify(p)})
export const updateTenant=(id:string,p:Partial<Tenant>&{version:number})=>api<Tenant>(`/tenants/${id}`,{method:'PATCH',body:JSON.stringify(p)})
