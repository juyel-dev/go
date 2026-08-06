/**
 * Built-in plugin: marks link.expired events (the actual DB update happens
 * in the pg_cron job -- see supabase/migrations -- this plugin just reacts
 * to the event for logging/future-notification purposes).
 */
import { registerPlugin } from "@/lib/plugins/registry";

registerPlugin({
  name: "expiry-cleanup",
  listensTo: ["link.expired"],
  onEvent: async (event) => {
    // Placeholder for Phase 2: notify workspace owner their link expired.
    console.log("[expiry-cleanup]", event.payload);
  },
});
