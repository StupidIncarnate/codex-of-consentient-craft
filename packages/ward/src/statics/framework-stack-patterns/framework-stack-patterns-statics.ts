/**
 * PURPOSE: Defines patterns for identifying framework-internal stack trace lines that add no diagnostic value
 *
 * USAGE:
 * frameworkStackPatternsStatics.patterns;
 * // Returns array of substring patterns that indicate a framework-internal stack line
 */
export const frameworkStackPatternsStatics = {
  patterns: [
    'node_modules/jest-circus/',
    'node_modules/jest-runner/',
    'node_modules/expect/build/',
    'node_modules/jest-jasmine2/',
    'node_modules/jest-runtime/',
    'at new Promise (<anonymous>)',
    'at processTicksAndRejections',
  ],
} as const;
