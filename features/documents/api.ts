import {api}from '@/lib/api/http'
export type DocumentTemplate={id:string;templateKey:string;name:string;category:string;locale:string;active:boolean}
export type GeneratedDocument={id:string;entityType:string;entityId:string;status:string;renderedBody:string;generatedAt:string}
export const listDocumentTemplates=()=>api<{items:DocumentTemplate[]}>('/document-templates')
export const listGeneratedDocuments=()=>api<{items:GeneratedDocument[]}>('/generated-documents')
export const exportGeneratedDocument=(id:string)=>api<{filename:string;content:string;contentType:string}>(`/generated-documents/${id}/export`,{method:'POST'})
