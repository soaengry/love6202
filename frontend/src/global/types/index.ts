export interface ApiResponse<T> {
  status: {
    code: number;
    message: string;
  };
  data: T;
}
