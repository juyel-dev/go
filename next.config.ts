import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
};

export default nextConfig;

// Enables local `next dev` to see Cloudflare bindings (KV, etc.) via
// getCloudflareContext() during development. See docs/FOLDER_STRUCTURE.md.
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
initOpenNextCloudflareForDev();
