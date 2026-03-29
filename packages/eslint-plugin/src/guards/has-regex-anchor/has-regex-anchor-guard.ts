/**
 * PURPOSE: Checks if a regex pattern string contains at least one meaningful anchor (^ or $)
 *
 * USAGE:
 * const isAnchored = hasRegexAnchorGuard({ pattern: '^hello$' });
 * // Returns true
 *
 * WHEN-TO-USE: When validating regex patterns in ESLint rules to prevent partial matching
 */
export const hasRegexAnchorGuard = ({ pattern }: { pattern?: string }): boolean => {
  if (pattern === undefined) {
    return false;
  }

  const hasStartAnchor = pattern.startsWith('^') && !pattern.startsWith('^.*');
  const hasEndAnchor = pattern.endsWith('$') && !pattern.endsWith('.*$');

  return hasStartAnchor || hasEndAnchor;
};
