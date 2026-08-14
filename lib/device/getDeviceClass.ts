import { cookies } from "next/headers";
import { type DeviceClass, DEVICE_COOKIE_NAME } from "./deviceClass";

/** Server Component helper -- reads the device-class cookie set by
 *  middleware.ts so the correct screen variant renders on first paint,
 *  no client-side flash. See docs/FOLDER_STRUCTURE.md §3. */
export async function getDeviceClass(): Promise<DeviceClass> {
  const cookieStore = await cookies();
  const value = cookieStore.get(DEVICE_COOKIE_NAME)?.value;
  if (value === "mobile" || value === "tablet" || value === "desktop") {
    return value;
  }
  return "desktop";
}
