export type Paginated<T> = {
    data: T[]
    meta: {
      page: number
      pageSize: number
      totalItems: number
      totalPages: number
    }
  }

export type PaginationParams<T extends object = {}> = {
page: number;
limit: number;
} & T;
  
  