import { api } from '@/lib/api/http'
export type Settlement={id:string;number:string;ownerId:string;fromDate:string;toDate:string;grossCollections:number;managementFees:number;ownerExpenses:number;adjustments:number;netDue:number;transferAmount:number;remainingBalance:number;status:'draft'|'confirmed'|'voided';transfers:{id:string;amount:number;transferDate:string;transactionReference:string;status:string}[]}
export const listSettlements=()=>api<{items:Settlement[]}>('/owner-settlements')
export const getSettlement=(id:string)=>api<Settlement>(`/owner-settlements/${id}`)
export type SettlementInput={ownerId:string;fromDate:string;toDate:string;paymentIds:string[];expenseIds:string[];adjustments:{amount:number;reason:string;type:'manual'|'rounding'|'correction'}[]}
export const previewSettlement=(payload:SettlementInput)=>api<{grossCollections:number;managementFees:number;ownerExpenses:number;adjustments:number;netDue:number}>('/owner-settlements/preview',{method:'POST',body:JSON.stringify(payload)})
export const createSettlement=(payload:SettlementInput)=>api<Settlement>('/owner-settlements',{method:'POST',headers:{'Idempotency-Key':crypto.randomUUID()},body:JSON.stringify(payload)})
export const confirmSettlement=(id:string)=>api<Settlement>(`/owner-settlements/${id}/confirm`,{method:'POST'})
export const createTransfer=(id:string,payload:{ownerBankAccountId:string;amount:number;transferDate:string;transactionReference:string})=>api<{id:string;amount:number}>(`/owner-settlements/${id}/transfers`,{method:'POST',body:JSON.stringify(payload)})
