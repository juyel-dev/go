import { getDeviceClass } from "@/lib/device/getDeviceClass";
import { LinksScreenMobile } from "./LinksScreen.mobile";
import { LinksScreenTablet } from "./LinksScreen.tablet";
import { LinksScreenDesktop } from "./LinksScreen.desktop";
import type { Link } from "@/lib/services/linkService";

/**
 * Device-adaptive screen composition -- docs/FOLDER_STRUCTURE.md §3.
 * Server Component: reads the device-class cookie (set by middleware.ts
 * from User-Agent) so the correct variant renders on first paint, no
 * client-side flash. All three variants share this same `links` data --
 * only the layout differs.
 */
export async function LinksScreen({ links, appUrl }: { links: Link[]; appUrl: string }) {
  const device = await getDeviceClass();

  if (device === "mobile") return <LinksScreenMobile links={links} appUrl={appUrl} />;
  if (device === "tablet") return <LinksScreenTablet links={links} appUrl={appUrl} />;
  return <LinksScreenDesktop links={links} appUrl={appUrl} />;
}
