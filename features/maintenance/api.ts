import { api } from '@/lib/api/http'
export type MaintenanceRequest={id:string;propertyId:string;spaceId?:string|null;ownerId?:string|null;title:string;description?:string|null;priority:'low'|'medium'|'high'|'urgent';estimatedCost:number;actualCost?:number|null;requiresOwnerApproval:boolean;approvalStatus:'not_required'|'pending'|'approved'|'rejected';status:string;version:number}
export const listMaintenance=()=>api<{items:MaintenanceRequest[]}>('/maintenance-requests')
export const decideMaintenance=(id:string,decision:'approved'|'rejected',reason?:string)=>api<MaintenanceRequest>(`/maintenance-requests/${id}/decision`,{method:'POST',body:JSON.stringify({decision,reason})})
export const createMaintenance=(payload:{propertyId:string;spaceId?:string;title:string;description?:string;priority:'low'|'medium'|'high'|'urgent';estimatedCost:number;requiresOwnerApproval:boolean})=>api<MaintenanceRequest>('/maintenance-requests',{method:'POST',body:JSON.stringify(payload)})
