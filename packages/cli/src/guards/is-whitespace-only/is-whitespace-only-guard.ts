/**
 * PURPOSE: Reports whether a string holds nothing but whitespace (including the empty string) —
 * used to confirm a slice of source text taken up to a node's start is really indentation, not part
 * of a preceding token, before trusting it as the line's indent.
 *
 * USAGE:
 * isWhitespaceOnlyGuard({ candidate: '    ' });
 * // Returns true
 * isWhitespaceOnlyGuard({ candidate: '  "paths": ' });
 * // Returns false
 */

export const isWhitespaceOnlyGuard = ({ candidate }: { candidate?: string }): boolean =>
  candidate?.trim().length === 0;
