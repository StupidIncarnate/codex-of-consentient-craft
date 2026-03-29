/**
 * PURPOSE: Defines matcher method names that accept regex patterns and require anchoring
 *
 * USAGE:
 * import { regexMatchMethodsStatics } from './statics/regex-match-methods/regex-match-methods-statics';
 * const isBanned = regexMatchMethodsStatics.anchorRequired.includes(methodName);
 */
export const regexMatchMethodsStatics = {
  anchorRequired: ['toMatch', 'toHaveText', 'toContainText'],
} as const;
