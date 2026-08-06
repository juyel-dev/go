import { z } from "zod";

// Length cap matches practical browser URL limits -- see docs/EDGE_CASES.md §5.
export const createLinkSchema = z.object({
  destinationUrl: z
    .string()
    .trim()
    .min(1, "Enter a URL to shorten.")
    .max(2048, "That URL is too long.")
    .url("Enter a valid URL, including https://"),
  slug: z
    .string()
    .trim()
    .min(3, "Slug must be at least 3 characters.")
    .max(64, "Slug must be under 64 characters.")
    .regex(/^[a-zA-Z0-9-_]+$/, "Only letters, numbers, - and _ are allowed.")
    .optional(),
  workspaceId: z.string().uuid().nullable().optional(),
  createdBy: z.string().uuid().nullable().optional(),
  password: z.string().min(4).max(128).optional(),
  expiresAt: z.string().datetime().nullable().optional(),
  maxClicks: z.number().int().positive().nullable().optional(),
  tags: z.array(z.string()).optional(),
  folderId: z.string().uuid().nullable().optional(),
});

export type CreateLinkInput = z.infer<typeof createLinkSchema>;
