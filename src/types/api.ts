export interface ApiResponse<T> {
  code: string;
  message: string;
  data: T;
  traceId?: string;
}

export interface ApiError {
  code: string;
  message: string;
  data?: unknown;
  traceId?: string;
  status?: number;
  notified?: boolean;
}

export interface PageQuery {
  pageNo: number;
  pageSize: number;
  keyword?: string;
  status?: string;
  filters?: Record<string, unknown>;
}

export interface PageResult<T> {
  list: T[];
  pageNo: number;
  pageSize: number;
  total: number;
}

export interface PlaceholderResult {
  status: 'PLACEHOLDER';
  message: string;
}
