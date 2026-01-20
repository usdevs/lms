export type Paginated<T> = {
    data: T[]
    meta: {
      page: number
      pageSize: number
      totalItems: number
      totalPages: number
    }
  }

export type PaginationParams<
  T extends Record<string, unknown> = Record<string, never>
> = {page: number; limit: number } & T;

  
  