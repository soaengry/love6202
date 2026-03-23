export class AppError extends Error {
  constructor(
    public code: string,
    public statusCode: number,
    message?: string,
  ) {
    super(message ?? code);
  }

  static from(errorCode: { code: string; status: number; message: string }) {
    return new AppError(errorCode.code, errorCode.status, errorCode.message);
  }
}
