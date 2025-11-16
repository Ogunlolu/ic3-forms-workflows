export type ApiResponse<T = any> = {
  data?: T
  error?: {
    code: string
    message: string
    details?: any
  }
}

export type PaginatedResponse<T> = {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export type ErrorCode =
  | 'VALIDATION_ERROR'
  | 'NOT_FOUND'
  | 'FORBIDDEN'
  | 'UNAUTHORIZED'
  | 'CONFLICT'
  | 'INTERNAL_ERROR'

