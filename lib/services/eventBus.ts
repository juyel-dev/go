/**
 * Internal event bus -- ARCHITECTURE.md §8, FOLDER_STRUCTURE.md §4.
 *
 * Domain events are emitted at the moment they happen and persisted to
 * event_log (lightweight, lifecycle-only -- NOT click-level, that's the
 * `clicks` table). Plugins subscribe here. The MVP has exactly one listener
 * (click-logging is actually driven by the redirect path directly, not this
 * bus, for latency reasons -- see lib/plugins/core/click-logging.ts).
 *
 * Adding a Phase 2/3 feature (webhooks, AI anomaly detection, Slack
 * notifications) means registering a new plugin that listens here -- this
 * file and the redirect/link-creation core code are never touched again.
 */
import { createServiceRoleClient } from "@/lib/supabase/server";
import { getActivePlugins } from "@/lib/plugins/registry";

export type EventType =
  | "link.created"
  | "link.claimed"
  | "link.expired"
  | "link.deleted"
  | "workspace.member_added";

export type DomainEvent = {
  eventType: EventType;
  workspaceId?: string | null;
  payload: Record<string, unknown>;
};

export async function emit(event: DomainEvent): Promise<void> {
  const supabase = createServiceRoleClient();

  // Persist to event_log -- audit trail + future AI/webhook backfill source.
  await supabase.from("event_log").insert({
    workspace_id: event.workspaceId ?? null,
    event_type: event.eventType,
    payload: event.payload,
  });

  // Fan out to any plugin listening for this event type.
  const listeners = getActivePlugins().filter((p) =>
    p.listensTo?.includes(event.eventType)
  );
  await Promise.all(listeners.map((p) => p.onEvent?.(event)));
}
