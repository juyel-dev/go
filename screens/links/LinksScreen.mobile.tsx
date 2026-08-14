"use client";

import Link from "next/link";
import { Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LinkStatusBadge } from "@/components/links/link-status-badge";
import type { Link as ShortLink } from "@/lib/services/linkService";

export function LinksScreenMobile({ links, appUrl }: { links: ShortLink[]; appUrl: string }) {
  if (links.length === 0) return <EmptyState />;

  return (
    <div className="flex flex-col gap-3 p-4">
      {links.map((link) => (
        <Card key={link.id} className="gap-2 p-4">
          <div className="flex items-center justify-between">
            <Link href={`/links/${link.id}`} className="data-mono text-accent">
              /{link.slug}
            </Link>
            <LinkStatusBadge link={link} />
          </div>
          <p className="truncate text-sm text-muted-foreground">{link.destinationUrl}</p>
          <div className="flex items-center justify-between pt-1">
            <span className="data-mono text-xs text-muted-foreground">
              {link.clickCount} click{link.clickCount === 1 ? "" : "s"}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigator.clipboard.writeText(`${appUrl}/${link.slug}`)}
            >
              <Copy className="size-3" />
              Copy
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center gap-2 p-12 text-center">
      <p className="font-medium">No links yet.</p>
      <p className="text-sm text-muted-foreground">Shorten your first URL to see it here.</p>
    </div>
  );
}
