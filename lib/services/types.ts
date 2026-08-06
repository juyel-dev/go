/**
 * Shared service-layer types. See docs/API.md §2.
 *
 * Every service function returns a Result<T, E> instead of throwing for
 * expected business errors. This is what lets Server Actions, the future
 * /api/v1 routes, and a future MCP adapter all consume the same functions
 * with predictable, typed error handling -- see ARCHITECTURE.md §8.
 */
export type Result<T, E = ServiceError> =
  | { ok: true; data: T }
  | { ok: false; error: E };

export type ServiceErrorCode =
  | "NOT_FOUND"
  | "FORBIDDEN"
  | "RATE_LIMITED"
  | "RESERVED_SLUG"
  | "SLUG_TAKEN"
  | "VALIDATION_ERROR"
  | "EXPIRED"
  | "UNKNOWN";

export type ServiceError = {
  code: ServiceErrorCode;
  message: string;
};

export function ok<T>(data: T): Result<T, never> {
  return { ok: true, data };
}

export function err(code: ServiceErrorCode, message: string): Result<never> {
  return { ok: false, error: { code, message } };
}
