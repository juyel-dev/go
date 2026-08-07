"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Copy, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { quickShorten } from "@/app/(marketing)/actions";

export function QuickShortenForm() {
  const [url, setUrl] = useState("");
  const [result, setResult] = useState<{ slug: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [isPending, startTransition] = useTransition();

  const shortUrl = result ? `${process.env.NEXT_PUBLIC_APP_URL ?? "https://shrtly.myself-juyel-dev.workers.dev"}/${result.slug}` : null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const res = await quickShorten(url);
      if (!res.ok) {
        toast.error(res.error.message);
        return;
      }
      setResult({ slug: res.data.slug });
      toast.success("Link created");
    });
  }

  async function handleCopy() {
    if (!shortUrl) return;
    await navigator.clipboard.writeText(shortUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="w-full max-w-xl">
      <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row">
        <Input
          type="url"
          required
          placeholder="Paste a long URL to shorten"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="h-11 flex-1"
        />
        <Button type="submit" size="lg" disabled={isPending} className="h-11">
          {isPending ? <Loader2 className="animate-spin" /> : "Shorten"}
        </Button>
      </form>

      {shortUrl && (
        <div className="mt-4 flex flex-col gap-2 rounded-lg border border-border bg-surface p-4">
          <div className="flex items-center justify-between gap-3">
            <a
              href={shortUrl}
              target="_blank"
              rel="noreferrer"
              className="data-mono truncate text-accent hover:underline"
            >
              {shortUrl}
            </a>
            <Button variant="outline" size="icon-sm" onClick={handleCopy} aria-label="Copy link">
              {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            This link expires in 7 days. Sign up to keep it forever.
          </p>
        </div>
      )}
    </div>
  );
}
