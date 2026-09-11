export type ApiError = { field?: string; code: string; message: string }

const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? '/api/backend/v1'

export class HttpError extends Error {
  constructor(public readonly status: number, public readonly errors: ApiError[]) { super(errors[0]?.message ?? 'تعذر إتمام الطلب.') }
}

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = typeof window === 'undefined' ? null : sessionStorage.getItem('accessToken')
  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: { Accept: 'application/json', 'Content-Type': 'application/json', 'X-Request-Id': crypto.randomUUID(), ...(token ? { Authorization: `Bearer ${token}` } : {}), ...init.headers },
  })
  const body = await response.json().catch(() => ({}))
  if (!response.ok) throw new HttpError(response.status, body.errors ?? [{ code: 'request_failed', message: 'تعذر الاتصال بالخادم.' }])
  return body.data as T
}
