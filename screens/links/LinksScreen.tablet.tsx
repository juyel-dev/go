"use client";

import Link from "next/link";
import { Copy } from "lucide-react";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { LinkStatusBadge } from "@/components/links/link-status-badge";
import type { Link as ShortLink } from "@/lib/services/linkService";

export function LinksScreenTablet({ links, appUrl }: { links: ShortLink[]; appUrl: string }) {
  if (links.length === 0) return <EmptyState />;

  return (
    <div className="p-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Short link</TableHead>
            <TableHead className="text-right">Clicks</TableHead>
            <TableHead>Status</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {links.map((link) => (
            <TableRow key={link.id}>
              <TableCell className="data-mono">
                <Link href={`/links/${link.id}`} className="text-accent">
                  /{link.slug}
                </Link>
              </TableCell>
              <TableCell className="data-mono text-right">{link.clickCount}</TableCell>
              <TableCell>
                <LinkStatusBadge link={link} />
              </TableCell>
              <TableCell>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => navigator.clipboard.writeText(`${appUrl}/${link.slug}`)}
                >
                  <Copy className="size-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center gap-2 p-16 text-center">
      <p className="font-medium">No links yet.</p>
      <p className="text-sm text-muted-foreground">Shorten your first URL to see it here.</p>
    </div>
  );
}
