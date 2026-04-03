// 환경 변수를 모듈 로드 전에 설정
process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test-jwt-secret-for-testing-only";
process.env.JWT_ACCESS_EXPIRATION = "3600000";
process.env.JWT_REFRESH_EXPIRATION = "86400000";
process.env.DATABASE_URL = "postgresql://test:test@localhost:5432/test";
process.env.REDIS_URL = "redis://localhost:6379";
process.env.FRONTEND_URL = "http://localhost:3000";
process.env.GOOGLE_CLIENT_ID = "test-google-client-id";
process.env.GOOGLE_CLIENT_SECRET = "test-google-client-secret";
process.env.GOOGLE_REDIRECT_URI = "http://localhost:8000/login/oauth2/code/google";
process.env.PORT = "8000";
