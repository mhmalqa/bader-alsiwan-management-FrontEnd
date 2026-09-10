export interface ListQuery { page?: number; perPage?: number; search?: string; sort?: string; direction?: 'asc' | 'desc'; status?: string }
export interface PaginatedResult<T> { items: T[]; page: number; perPage: number; total: number }
export interface ApiError { message: string; code?: string; fields?: Record<string, string[]> }
