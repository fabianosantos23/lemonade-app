export enum Status {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  DELETED = 'DELETED',
}

export type ApiSuccessResponse<T> = {
  statusCode: number;
  message: string;
  timestamp: string;
  data: T;
}

export type PaginatedResponse<T> = {
  totalItems: number;
  itemsPerPage: number;
  currentPage: number;
  totalPages: number;
  data: T[];
}
