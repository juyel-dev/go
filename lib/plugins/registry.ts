/**
 * Plugin registry -- FOLDER_STRUCTURE.md §4.
 *
 * Formalizes the event bus into a real extension point. MVP features are
 * built AS plugins (see lib/plugins/core/) so the pattern is proven from day
 * one rather than retrofitted when the first Phase 2/3 plugin arrives.
 */
import type { EventType, DomainEvent } from "@/lib/services/eventBus";

export type Role = "owner" | "admin" | "member";

export type PluginRouteDef = {
  path: string;
};

export type Plugin = {
  name: string;
  listensTo?: EventType[];
  onEvent?: (event: DomainEvent) => Promise<void>;
  navItem?: { label: string; route: string; icon: string; roles?: Role[] };
  routes?: PluginRouteDef[];
};

const registeredPlugins: Plugin[] = [];

export function registerPlugin(plugin: Plugin): void {
  registeredPlugins.push(plugin);
}

export function getActivePlugins(): Plugin[] {
  return registeredPlugins;
}
