export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: PaginationMeta;
}

export interface ApiResponse<T> {
  data: T;
  message: string;
  statusCode: number;
  pagination?: PaginationMeta;
}
