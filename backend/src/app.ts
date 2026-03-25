import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { errorHandler } from "@/middleware/errorHandler";
import { env } from "@/config/env";
import authRouter from "@/domain/user/auth.router";
import userRouter from "@/domain/user/user.router";
import weddingRouter from "@/domain/wedding/wedding.router";
import bankRouter from "@/domain/bank/bank.router";

const app = express();

app.use(helmet());
app.use(cors({
  origin: env.FRONTEND_URL,
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

// Google OAuth2 콜백 → 프론트엔드로 code 전달
app.get("/login/oauth2/code/google", (req, res) => {
  const code = req.query.code as string;
  res.redirect(`${env.FRONTEND_URL}/oauth2/callback?code=${encodeURIComponent(code)}`);
});

app.use("/api/auth", authRouter);
app.use("/api/users", userRouter);
app.use("/api/weddings", weddingRouter);
app.use("/api/banks", bankRouter);

app.use(errorHandler);

export default app;
