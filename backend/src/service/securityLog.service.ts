// 보안 이벤트 구조화 로깅
// 프로덕션에서는 이 로그를 CloudWatch / ELK 등으로 수집
export function logSecurityEvent(
  event: string,
  meta: Record<string, unknown>,
): void {
  const entry = {
    level: "SECURITY",
    event,
    ts: new Date().toISOString(),
    ...meta,
  };

  if (process.env.NODE_ENV === "production") {
    console.warn(JSON.stringify(entry));
  } else {
    console.warn("[SECURITY]", entry);
  }
}
