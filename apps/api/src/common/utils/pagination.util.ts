export interface PaginationOptions {
  page?: number;
  limit?: number;
}

export interface PaginationResult<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export function paginate<T>(
  items: T[],
  total: number,
  options: PaginationOptions,
): PaginationResult<T> {
  const page = options.page || 1;
  const limit = options.limit || 20;
  return {
    data: items,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}
