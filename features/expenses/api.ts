import { api } from '@/lib/api/http'
export type Expense={id:string;propertyId:string;spaceId?:string|null;ownerId?:string|null;vendorId?:string|null;vendorName?:string|null;description:string;category:string;netAmount:number;vatAmount:number;grossAmount:number;expenseDate:string;invoiceNumber?:string|null;chargeableToOwner:boolean;approvalStatus:'not_required'|'pending'|'approved'|'rejected';status:string;version:number}
export const listExpenses=()=>api<{items:Expense[]}>('/expenses')
export const getExpense=(id:string)=>api<Expense>(`/expenses/${id}`)
export const decideExpense=(id:string,decision:'approved'|'rejected',reason?:string)=>api<Expense>(`/expenses/${id}/decision`,{method:'POST',body:JSON.stringify({decision,reason})})
export const createExpense=(payload:{propertyId:string;spaceId?:string;vendorName?:string;description:string;category:string;netAmount:number;vatAmount:number;expenseDate:string;chargeableToOwner:boolean;requiresApproval:boolean})=>api<Expense>('/expenses',{method:'POST',body:JSON.stringify(payload)})
export const updateExpense=(id:string,payload:{version:number;propertyId:string;spaceId?:string;vendorName?:string;description:string;category:string;netAmount:number;vatAmount:number;expenseDate:string;chargeableToOwner:boolean})=>api<Expense>(`/expenses/${id}`,{method:'PATCH',body:JSON.stringify(payload)})
