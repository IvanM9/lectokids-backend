export interface PaginationParams {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface PaginationDefaults {
  page: number;
  limit: number;
  maxLimit: number;
  sort: string;
  order: 'asc' | 'desc';
}

export const PAGINATION_DEFAULTS: PaginationDefaults = {
  page: 1,
  limit: 10,
  maxLimit: 100,
  sort: 'createdAt',
  order: 'asc',
};