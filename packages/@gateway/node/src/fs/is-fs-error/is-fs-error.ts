/**
 * PURPOSE: Realm-safe check for whether a value is a filesystem error carrying a given `code`.
 * Node builds `fs`/`fs/promises` rejections outside Jest's vm realm, so `instanceof Error` is
 * false for a real rejection inside a test even though it is true in production — this checks
 * the shape instead (an object with a `code` field) so the same guard is correct in both places.
 * Every fs wrapper in this package reaches for this over a raw `error.code === '…'` check or
 * `instanceof`, because the field access alone throws on a non-object `error`.
 *
 * USAGE:
 * const check = { error, code: 'ENOENT' };
 * if (isFsError(check)) {
 *   check.error.code; // narrowed to FsError, readable without a further cast
 * }
 */
import type { FsError } from './fs-error';

// TypeScript refuses a type predicate on a name bound by destructuring (TS1230: "A type predicate
// cannot reference element 'error' in a binding pattern"), so the parameter stays a single
// identifier here — `params.error`, not a destructured `error` — even though every OTHER wrapper in
// this package destructures its object argument in the signature.
export const isFsError = (params: {
  error: unknown;
  code: string;
}): params is { error: FsError; code: string } => {
  const { error, code } = params;
  return typeof error === 'object' && error !== null && 'code' in error && error.code === code;
};
