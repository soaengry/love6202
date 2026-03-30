import nodemailer from "nodemailer";
import { env } from "@/config/env";

function createTransporter() {
  if (!env.SMTP_HOST || !env.SMTP_USER || !env.SMTP_PASS) return null;
  return nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_PORT === 465,
    auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
  });
}

export async function sendNewDeviceLoginAlert(
  toEmail: string,
  deviceId: string,
): Promise<void> {
  const transporter = createTransporter();
  if (!transporter) return; // SMTP 미설정 시 무시

  const now = new Date().toLocaleString("ko-KR", { timeZone: "Asia/Seoul" });

  await transporter.sendMail({
    from: `"love6202" <${env.SMTP_USER}>`,
    to: toEmail,
    subject: "[love6202] 새로운 기기에서 로그인되었습니다",
    html: `
      <p>안녕하세요,</p>
      <p><strong>새로운 기기</strong>에서 계정에 로그인되었습니다.</p>
      <ul>
        <li>시각: ${now}</li>
        <li>기기 ID: ${deviceId.slice(0, 8)}****</li>
      </ul>
      <p>본인이 로그인하지 않았다면, 즉시 <a href="${env.FRONTEND_URL}/settings">계정 설정</a>에서 모든 기기 로그아웃을 진행해주세요.</p>
    `,
  });
}
