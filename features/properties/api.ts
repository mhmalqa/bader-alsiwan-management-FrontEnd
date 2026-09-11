import { api } from '@/lib/api/http'
export type Property = { id: string; propertyCode: string; propertyName: string; ownerId: string; ownerName?: string; propertyType: string; city: string; district: string; status: string; version: number }
export type PropertySpace = { id: string; propertyId: string; unitCode: string; unitNameOrNumber: string; unitType: string; floor?: string | null; area?: number | null; expectedAnnualRent?: number | null; status: string; version: number }
export type PropertyPortfolio = { property: Property; spaces: PropertySpace[]; leases: unknown[]; receivables: unknown[]; expenses: unknown[]; maintenance: unknown[] }
export const listProperties = () => api<{ items: Property[] }>('/properties')
export const getPropertyPortfolio = (id: string) => api<PropertyPortfolio>(`/properties/${id}/portfolio`)
export const getProperty = (id: string) => api<Property>(`/properties/${id}`)
export const createProperty = (payload: { propertyCode:string; propertyName:string; ownerId:string; propertyType:string; city:string; district:string; deedNumber?:string }) => api<Property>('/properties',{method:'POST',body:JSON.stringify(payload)})
export const updateProperty = (id:string,payload:Partial<Property>&{version:number}) => api<Property>(`/properties/${id}`,{method:'PATCH',body:JSON.stringify(payload)})
export const getPropertySpace = (id:string) => api<PropertySpace>(`/property-spaces/${id}`)
export const createPropertySpace = (propertyId:string,payload:{unitCode:string;unitNameOrNumber:string;unitType:string;floor?:string;area?:number;expectedAnnualRent?:number}) => api<PropertySpace>(`/properties/${propertyId}/spaces`,{method:'POST',body:JSON.stringify(payload)})
export const updatePropertySpace = (id:string,payload:Partial<PropertySpace>&{version:number}) => api<PropertySpace>(`/property-spaces/${id}`,{method:'PATCH',body:JSON.stringify(payload)})
