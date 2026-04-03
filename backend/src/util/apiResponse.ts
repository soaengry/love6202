export const apiResponse = {
  ok<T>(message: string, data: T) {
    return { status: { code: 200, message }, data };
  },
  created<T>(message: string, data: T) {
    return { status: { code: 201, message }, data };
  },
  error(code: number, message: string) {
    return { status: { code, message }, data: null };
  },
};
