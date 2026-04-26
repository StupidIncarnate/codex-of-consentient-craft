/**
 * PURPOSE: Filter for the no-bare-location-literals rule's banned-set construction. Keeps a literal only when it contains '.' or '/' OR length >= minRetainedLength. Drops generic single words like 'design', 'guilds', 'projects' that would false-positive on JSDoc, error messages, and unrelated string usage.
 *
 * USAGE:
 * shouldRetainLocationLiteralGuard({ literal: '.mcp.json', minRetainedLength: 8 });
 * // Returns true
 * shouldRetainLocationLiteralGuard({ literal: 'design', minRetainedLength: 8 });
 * // Returns false
 *
 * WHEN-TO-USE: Only the no-bare-location-literals rule's banned-set walker should call this.
 */
export const shouldRetainLocationLiteralGuard = ({
  literal,
  minRetainedLength,
}: {
  literal?: string;
  minRetainedLength?: number;
}): boolean => {
  if (literal === undefined || literal.length === 0) {
    return false;
  }
  if (literal.includes('.') || literal.includes('/')) {
    return true;
  }
  if (minRetainedLength === undefined) {
    return false;
  }
  return literal.length >= minRetainedLength;
};
