/**
 * PURPOSE: Realm-safe check for whether a value is a filesystem error carrying a given `code`.
 * Node builds `fs`/`fs/promises` rejections outside Jest's vm realm, so `instanceof Error` is
 * false for a real rejection inside a test even though it is true in production — this checks
 * the shape instead (an object with a `code` field) so the same guard is correct in both places.
 * Every fs wrapper in this package reaches for this over a raw `error.code === '…'` check or
 * `instanceof`, because the field access alone throws on a non-object `error`.
 *
 * USAGE:
 * isFsError({ error, code: 'ENOENT' });
 * // Returns true when error is an object whose `code` field is exactly 'ENOENT'
 */

// Extends Error (not a bare shape) because FsErrorStub builds a real `Error` instance — needed so
// `registerMock`'s `.rejects()` staging and Jest's `.toThrow()` both accept it without rewrapping
// or a type error; `isFsError` itself only ever reads `.code` off `unknown`; it never assumes this
// type going in.
export interface FsError extends Error {
  code: string;
  path?: string;
  syscall?: string;
}

export const isFsError = ({ error, code }: { error: unknown; code: string }): boolean =>
  typeof error === 'object' && error !== null && 'code' in error && error.code === code;
