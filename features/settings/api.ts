import { api } from '@/lib/api/http'

export type Organization = { id: string; name: string; timezone: string; defaultCurrency: string }
export type AuditLog = { id: string; action: string; entityType: string; entityId: string; createdAt: string }
export type Permission = { id: string; code: string; name: string; module: string }
export type Role = { id: string; code: string; name: string; is_system?: boolean; isSystem?: boolean; permissions: Permission[] }
export type User = { id: string; fullName: string; email: string; status: 'active' | 'inactive' | 'archived'; version: number; roles: { id: string; code: string; name: string }[] }
export const getOrganization = () => api<Organization>('/settings')
export const updateOrganization = (payload: Partial<Omit<Organization, 'id'>>) => api<Organization>('/settings', { method: 'PUT', body: JSON.stringify(payload) })
export const listAuditLogs = () => api<{ items: AuditLog[] }>('/audit-logs')
export const listRoles = () => api<{ items: Role[] }>('/roles')
export const listPermissions = () => api<{ items: Permission[] }>('/permissions')
export const listUsers = () => api<{ items: User[] }>('/users')
export const createUser = (payload: { fullName: string; email: string; password: string; roleIds: string[]; status?: 'active' | 'inactive' }) => api<User>('/users', { method: 'POST', body: JSON.stringify(payload) })
export const updateUser = (id: string, payload: Partial<{ fullName: string; roleIds: string[]; status: 'active' | 'inactive' | 'archived' }> & { version: number }) => api<User>(`/users/${id}`, { method: 'PATCH', body: JSON.stringify(payload) })
export const createRole = (payload: { code: string; name: string; permissionIds: string[] }) => api<Role>('/roles', { method: 'POST', body: JSON.stringify(payload) })
