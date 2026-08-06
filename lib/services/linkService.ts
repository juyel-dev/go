/**
 * linkService -- docs/API.md §2, ARCHITECTURE.md §8.
 *
 * ALL link business logic lives here. UI (Server Actions), the reserved
 * /api/v1 routes (Phase 2), and a future MCP adapter (Phase 3) all call
 * these same functions -- never a UI component or route handler talking to
 * Supabase directly.
 */
import { customAlphabet } from "nanoid";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";
import { createLinkSchema, type CreateLinkInput } from "@/lib/validators/link";
import { isReservedSlug } from "@/lib/reserved-slugs";
import { setLinkMeta, invalidate } from "@/lib/kv/cacheService";
import { emit } from "@/lib/services/eventBus";
import { ok, err, type Result } from "@/lib/services/types";
import { isLikelyMaliciousUrl } from "@/lib/services/urlSafety";

// Unambiguous alphabet (no 0/O/1/l confusion) -- 7 chars ~= 3.5 trillion
// combinations, plenty of headroom before collision risk matters at MVP scale.
const generateSlug = customAlphabet(
  "23456789abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ",
  7
);

const MAX_SLUG_RETRIES = 5;

export type Link = {
  id: string;
  workspaceId: string | null;
  createdBy: string | null;
  slug: string;
  destinationUrl: string;
  title: string | null;
  isActive: boolean;
  hasPassword: boolean;
  expiresAt: string | null;
  maxClicks: number | null;
  clickCount: number;
  createdAt: string;
};

// Shape of a raw `links` row as returned by Supabase, until real generated
// types replace this (see lib/supabase/types.ts TODO).
type LinkRow = {
  id: string;
  workspace_id: string | null;
  created_by: string | null;
  slug: string;
  destination_url: string;
  title: string | null;
  is_active: boolean;
  password_hash: string | null;
  expires_at: string | null;
  max_clicks: number | null;
  click_count: number;
  created_at: string;
};

function toLink(row: LinkRow): Link {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    createdBy: row.created_by,
    slug: row.slug,
    destinationUrl: row.destination_url,
    title: row.title,
    isActive: row.is_active,
    hasPassword: Boolean(row.password_hash),
    expiresAt: row.expires_at,
    maxClicks: row.max_clicks,
    clickCount: row.click_count,
    createdAt: row.created_at,
  };
}

export async function create(input: CreateLinkInput): Promise<Result<Link>> {
  const parsed = createLinkSchema.safeParse(input);
  if (!parsed.success) {
    return err("VALIDATION_ERROR", parsed.error.issues[0]?.message ?? "Invalid input.");
  }
  const data = parsed.data;

  if (data.slug && isReservedSlug(data.slug)) {
    return err("RESERVED_SLUG", "That word is reserved for the app. Pick a different slug.");
  }

  if (isLikelyMaliciousUrl(data.destinationUrl)) {
    return err("VALIDATION_ERROR", "This destination URL can't be shortened.");
  }

  // Anonymous links: force 7-day expiry regardless of what was passed in --
  // see docs/DATABASE.md (links.expires_at) and EDGE_CASES.md §2.
  const isAnonymous = !data.workspaceId;
  const expiresAt = isAnonymous
    ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    : (data.expiresAt ?? null);

  const supabase = isAnonymous ? createServiceRoleClient() : await createClient();

  let passwordHash: string | null = null;
  if (data.password) {
    // Lightweight edge-runtime-safe hash (bcrypt/argon2 need Node crypto not
    // available at the edge -- Web Crypto PBKDF2 used instead). See
    // docs/ARCHITECTURE.md §5.
    passwordHash = await hashPassword(data.password);
  }

  const claimToken = isAnonymous ? crypto.randomUUID() : null;

  const slug = data.slug;
  let insertedRow: LinkRow | null = null;
  let lastError: { message: string; code?: string } | null = null;

  for (let attempt = 0; attempt < (slug ? 1 : MAX_SLUG_RETRIES); attempt++) {
    const candidateSlug = slug ?? generateSlug();
    const { data: row, error } = await supabase
      .from("links")
      .insert({
        workspace_id: data.workspaceId ?? null,
        created_by: data.createdBy ?? null,
        slug: candidateSlug,
        destination_url: data.destinationUrl,
        tags: data.tags ?? [],
        folder_id: data.folderId ?? null,
        password_hash: passwordHash,
        max_clicks: data.maxClicks ?? null,
        expires_at: expiresAt,
        claim_token: claimToken,
      })
      .select()
      .single();

    if (!error && row) {
      insertedRow = row;
      break;
    }

    lastError = error;
    // Unique violation on slug -- retry with a fresh auto-generated one,
    // unless the person explicitly requested this exact slug.
    if (slug || error?.code !== "23505") break;
  }

  if (!insertedRow) {
    if (lastError?.message?.includes("duplicate") || lastError?.message?.includes("unique")) {
      return err("SLUG_TAKEN", "This slug is already taken -- try another.");
    }
    return err("UNKNOWN", lastError?.message ?? "Could not create the link.");
  }

  const link = toLink(insertedRow);

  await setLinkMeta(link.slug, {
    id: link.id,
    slug: link.slug,
    destinationUrl: link.destinationUrl,
    isActive: link.isActive,
    expiresAt: link.expiresAt,
    maxClicks: link.maxClicks,
    clickCount: link.clickCount,
    hasPassword: link.hasPassword,
  });

  await emit({
    eventType: "link.created",
    workspaceId: link.workspaceId,
    payload: { linkId: link.id, slug: link.slug, anonymous: isAnonymous },
  });

  return ok(link);
}

export async function getBySlug(slug: string): Promise<Result<Link>> {
  const supabase = await createClient();
  const { data: row, error } = await supabase
    .from("links")
    .select()
    .eq("slug", slug)
    .single();

  if (error || !row) return err("NOT_FOUND", "We couldn't find that link.");
  return ok(toLink(row));
}

export async function listForWorkspace(
  workspaceId: string,
  filters?: { folderId?: string; tag?: string }
): Promise<Result<Link[]>> {
  const supabase = await createClient();
  let query = supabase.from("links").select().eq("workspace_id", workspaceId);

  if (filters?.folderId) query = query.eq("folder_id", filters.folderId);
  if (filters?.tag) query = query.contains("tags", [filters.tag]);

  const { data: rows, error } = await query.order("created_at", { ascending: false });
  if (error) return err("UNKNOWN", error.message);
  return ok((rows ?? []).map(toLink));
}

export async function archive(linkId: string, actorId: string): Promise<Result<void>> {
  // actorId isn't used in the query itself -- RLS already scopes the update
  // to links in workspaces the signed-in user belongs to. It's kept in the
  // signature (matches docs/API.md §2) for the audit-log write once
  // event_log gets a `link.archived` event type in a follow-up pass.
  void actorId;
  const supabase = await createClient();
  const { data: row, error } = await supabase
    .from("links")
    .update({ is_active: false })
    .eq("id", linkId)
    .select("slug")
    .single();

  if (error || !row) return err("NOT_FOUND", "Link not found or you don't have access.");
  await invalidate(row.slug);
  return ok(undefined);
}

/**
 * Claims cookie-tracked anonymous links into the signing-up user's default
 * workspace. See docs/SCREENS.md §2.1 and DATABASE.md (claim_token).
 */
export async function claimAnonymousLinks(
  claimTokens: string[],
  userId: string,
  workspaceId: string
): Promise<Result<{ claimed: number }>> {
  if (claimTokens.length === 0) return ok({ claimed: 0 });

  const supabase = createServiceRoleClient();
  const { data: rows, error } = await supabase
    .from("links")
    .update({
      workspace_id: workspaceId,
      created_by: userId,
      claim_token: null,
      claimed_at: new Date().toISOString(),
      expires_at: null,
    })
    .in("claim_token", claimTokens)
    .is("workspace_id", null)
    .select("id, slug");

  if (error) return err("UNKNOWN", error.message);

  const claimedRows = (rows ?? []) as Array<{ id: string; slug: string }>;
  await Promise.all(claimedRows.map((r) => invalidate(r.slug)));
  await emit({
    eventType: "link.claimed",
    workspaceId,
    payload: { linkIds: claimedRows.map((r) => r.id) },
  });

  return ok({ claimed: claimedRows.length });
}

async function hashPassword(password: string): Promise<string> {
  // bcrypt/argon2 need native bindings unavailable on the Workers edge
  // runtime, so we use salted PBKDF2 via Web Crypto instead -- this is a
  // deliberate deviation from the "bcrypt/argon2" wording in
  // docs/ARCHITECTURE.md §5 (link passwords are a lower-stakes secret than
  // account passwords, and this is the strongest option actually available
  // at the edge). Format: `{saltHex}:{hashHex}`.
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await pbkdf2(password, salt);
  return `${toHex(salt)}:${toHex(hash)}`;
}

async function verifyPasswordHash(password: string, stored: string): Promise<boolean> {
  const [saltHex, hashHex] = stored.split(":");
  if (!saltHex || !hashHex) return false;
  const salt = fromHex(saltHex);
  const hash = await pbkdf2(password, salt);
  return toHex(hash) === hashHex;
}

async function pbkdf2(password: string, salt: Uint8Array): Promise<ArrayBuffer> {
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  return crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: salt as BufferSource, iterations: 210_000, hash: "SHA-256" },
    keyMaterial,
    256
  );
}

function toHex(buf: ArrayBuffer | Uint8Array): string {
  return Array.from(buf instanceof Uint8Array ? buf : new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function fromHex(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
  }
  return bytes;
}

export async function verifyPassword(
  linkId: string,
  password: string
): Promise<Result<{ destinationUrl: string }>> {
  const supabase = createServiceRoleClient();
  const { data: row, error } = await supabase
    .from("links")
    .select("destination_url, password_hash, is_active, expires_at")
    .eq("id", linkId)
    .single();

  if (error || !row) return err("NOT_FOUND", "We couldn't find that link.");
  if (!row.is_active || (row.expires_at && new Date(row.expires_at) < new Date())) {
    return err("EXPIRED", "This link has expired and is no longer active.");
  }
  if (!row.password_hash) return ok({ destinationUrl: row.destination_url });

  const valid = await verifyPasswordHash(password, row.password_hash);
  if (!valid) return err("FORBIDDEN", "Incorrect password.");

  return ok({ destinationUrl: row.destination_url });
}
