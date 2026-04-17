/**
 * PURPOSE: Safely parses a JSON string, returning a discriminated result instead of throwing
 *
 * USAGE:
 * safeJsonParseTransformer({ value: '{"a":1}' });
 * // Returns { ok: true, value: { a: 1 } } or { ok: false } if parsing fails
 */

type SafeJsonParseResult = { ok: true; value: unknown } | { ok: false };

export const safeJsonParseTransformer = ({ value }: { value: string }): SafeJsonParseResult => {
  try {
    return { ok: true, value: JSON.parse(value) };
  } catch {
    return { ok: false };
  }
};
