import redis from "@/config/redis";
import bcrypt from "bcryptjs";

const TTL = 1 * 24 * 60 * 60; // 1일 (초)
const BCRYPT_ROUNDS = 10;

function key(userId: number, deviceId: string) {
  return `refresh:${userId}:${deviceId}`;
}

export async function save(userId: number, deviceId: string, token: string) {
  const hashed = await bcrypt.hash(token, BCRYPT_ROUNDS);
  await redis.setex(key(userId, deviceId), TTL, hashed);
}

export async function verify(
  userId: number,
  deviceId: string,
  token: string,
): Promise<boolean> {
  const stored = await redis.get(key(userId, deviceId));
  if (!stored) return false;
  return bcrypt.compare(token, stored);
}

export async function deleteByDevice(userId: number, deviceId: string) {
  await redis.del(key(userId, deviceId));
}

export async function deleteAllByUser(userId: number) {
  const keys = await redis.keys(`refresh:${userId}:*`);
  if (keys.length > 0) await redis.del(...keys);
}

export async function countDevices(userId: number): Promise<number> {
  const keys = await redis.keys(`refresh:${userId}:*`);
  return keys.length;
}

export async function evictOldestDevice(userId: number): Promise<void> {
  const keys = await redis.keys(`refresh:${userId}:*`);
  if (keys.length === 0) return;
  const ttls = await Promise.all(keys.map((k) => redis.ttl(k)));
  const oldestIdx = ttls.indexOf(Math.min(...ttls));
  await redis.del(keys[oldestIdx]);
}
