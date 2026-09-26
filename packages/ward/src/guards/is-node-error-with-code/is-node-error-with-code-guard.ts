/**
 * PURPOSE: Answers whether a caught value is shaped like a Node.js system error carrying a
 * specific `code` (`ENOENT`, `EACCES`, …) — a structural check rather than `instanceof Error`,
 * because Jest's sandbox breaks that check for errors Node itself constructs. Reach for this
 * wherever a `.catch` must swallow ONE specific failure and rethrow every other.
 *
 * USAGE:
 * isNodeErrorWithCodeGuard({ error: someCaughtValue, code: 'ENOENT' });
 * // Returns: true when the caught value has that exact `code` property
 */

export const isNodeErrorWithCodeGuard = ({
  error,
  code,
}: {
  error?: unknown;
  code?: string;
}): boolean =>
  error !== null &&
  error !== undefined &&
  typeof error === 'object' &&
  'code' in error &&
  error.code === code;
