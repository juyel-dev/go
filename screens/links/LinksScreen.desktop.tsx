"use client";

import Link from "next/link";
import { Copy } from "lucide-react";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { LinkStatusBadge } from "@/components/links/link-status-badge";
import type { Link as ShortLink } from "@/lib/services/linkService";

export function LinksScreenDesktop({ links, appUrl }: { links: ShortLink[]; appUrl: string }) {
  if (links.length === 0) return <EmptyState />;

  return (
    <div className="p-6">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Short link</TableHead>
            <TableHead>Destination</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Clicks</TableHead>
            <TableHead>Created</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {links.map((link) => (
            <TableRow key={link.id}>
              <TableCell className="data-mono">
                <div className="flex items-center gap-2">
                  <Link href={`/links/${link.id}`} className="text-accent hover:underline">
                    /{link.slug}
                  </Link>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => navigator.clipboard.writeText(`${appUrl}/${link.slug}`)}
                  >
                    <Copy className="size-3" />
                  </Button>
                </div>
              </TableCell>
              <TableCell className="max-w-xs truncate text-muted-foreground">
                {link.destinationUrl}
              </TableCell>
              <TableCell>
                <LinkStatusBadge link={link} />
              </TableCell>
              <TableCell className="data-mono text-right">{link.clickCount}</TableCell>
              <TableCell className="data-mono text-muted-foreground">
                {new Date(link.createdAt).toLocaleDateString()}
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
      <p className="text-sm text-muted-foreground">
        Shorten your first URL to see it here.
      </p>
    </div>
  );
}
