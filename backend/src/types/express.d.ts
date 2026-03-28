declare global {
  namespace Express {
    interface Request {
      userId?: number;
      userRole?: string;
      sessionId?: string;
    }
  }
}

export {};
