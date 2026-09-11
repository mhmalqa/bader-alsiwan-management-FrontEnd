import { api } from '@/lib/api/http'

export type AuthSession = { accessToken: string; expiresAt: string; user: { id: string; organizationId: string; fullName: string; email: string; permissions: string[] } }

export const login = (email: string, password: string) => api<AuthSession>('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) })
