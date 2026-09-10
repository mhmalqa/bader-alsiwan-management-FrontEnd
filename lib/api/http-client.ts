export type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'DELETE'
export interface ApiRequest { path: string; method?: HttpMethod; body?: unknown; query?: Record<string, string | number | boolean | undefined> }
export interface ApiResponse<T> { data: T; meta?: { page: number; perPage: number; total: number } }
export interface ApiClient { request<T>(request: ApiRequest): Promise<ApiResponse<T>> }
/** نقطة الاستبدال الوحيدة عند ربط الـBackend. لا تستدعِ fetch داخل Features. */
export const httpClient: ApiClient = { async request<T>() { throw new Error('عميل API غير موصول بعد. استخدم مستودع Mock في بيئة الواجهة.') } }
