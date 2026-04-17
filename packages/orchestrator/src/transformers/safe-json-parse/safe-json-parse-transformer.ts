/**
 * PURPOSE: Safely parses a JSON string, returning the parsed value or undefined on parse failure
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
