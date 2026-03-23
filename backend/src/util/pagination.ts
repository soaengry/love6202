export interface PaginationParams {
  page: number; // 0-based
  size: number;
}

export function paginate(params: PaginationParams) {
  return {
    skip: params.page * params.size,
    take: params.size,
  };
}
