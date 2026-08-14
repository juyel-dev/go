import { Badge } from "@/components/ui/badge";
import type { Link } from "@/lib/services/linkService";

/** Status vocabulary per DESIGN_SYSTEM.md §7 -- plain words, not enum values. */
export function LinkStatusBadge({ link }: { link: Link }) {
  const isExpired = link.expiresAt ? new Date(link.expiresAt) < new Date() : false;

  if (!link.isActive) return <Badge variant="destructive">Expired</Badge>;
  if (isExpired) return <Badge variant="destructive">Expired</Badge>;
  if (link.hasPassword) return <Badge variant="secondary">Password protected</Badge>;
  return <Badge variant="success">Active</Badge>;
}
