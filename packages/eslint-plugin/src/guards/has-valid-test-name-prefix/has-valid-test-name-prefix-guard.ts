/**
 * PURPOSE: Checks if a test name starts with a valid prefix (VALID:, INVALID:, ERROR:, EDGE:, EMPTY:)
 *
 * USAGE:
 * const isValid = hasValidTestNamePrefixGuard({ name: 'VALID: {input} => result' });
 * // Returns true
 *
 * WHEN-TO-USE: When validating test names in ESLint rules or test file analysis
 */
import { testNamePrefixStatics } from '../../statics/test-name-prefix/test-name-prefix-statics';

export const hasValidTestNamePrefixGuard = ({ name }: { name?: string }): boolean => {
  if (name === undefined) {
    return false;
  }

  return testNamePrefixStatics.validPrefixes.some((prefix) => name.startsWith(prefix));
};
