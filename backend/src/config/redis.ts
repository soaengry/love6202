import Redis from "ioredis";
import { env } from "@/config/env";

const redis = new Redis(env.REDIS_URL);

export function createSubscriber(): Redis {
  return new Redis(env.REDIS_URL);
}

export default redis;
