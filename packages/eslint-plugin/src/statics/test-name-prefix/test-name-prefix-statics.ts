/**
 * PURPOSE: Defines valid test name prefixes and truncation limits for test name validation
 *
 * USAGE:
 * import { testNamePrefixStatics } from './statics/test-name-prefix/test-name-prefix-statics';
 * const isValid = testNamePrefixStatics.validPrefixes.some(p => name.startsWith(p));
 */
export const testNamePrefixStatics = {
  validPrefixes: ['VALID:', 'INVALID:', 'ERROR:', 'EDGE:', 'EMPTY:'],
  maxDisplayLength: 60,
} as const;
