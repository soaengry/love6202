import { TOKEN_KEY } from "./auth.constants.ts";

export function getDeviceId(): string {
  let deviceId = localStorage.getItem(TOKEN_KEY.DEVICE_ID);
  if (!deviceId) {
    deviceId = crypto.randomUUID();
    localStorage.setItem(TOKEN_KEY.DEVICE_ID, deviceId);
  }
  return deviceId;
}
