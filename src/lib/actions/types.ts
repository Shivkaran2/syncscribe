// Shared result type for Server Actions.
// Kept in a plain (non-"use server") module so it can export a type.

export type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };
