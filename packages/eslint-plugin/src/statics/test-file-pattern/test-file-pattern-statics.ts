/**
 * PURPOSE: Defines test file naming patterns for different test types
 *
 * USAGE:
 * import { testFilePatternStatics } from './statics/test-file-pattern/test-file-pattern-statics';
 * const unitSuffixes = testFilePatternStatics.unit.suffixes;
 * // Returns ['.test', '.spec']
 * const allSuffixes = testFilePatternStatics.suffixes;
 * // Returns all test suffixes including integration and e2e patterns
 *
 * The canonical e2e suffix is the bare `.e2e` (Playwright files are `*.e2e.ts`). The
 * `.e2e.test` / `.e2e.spec` / `.spec` forms remain only for defensive recognition of
 * legacy/non-canonical names.
 *
 * WHEN-TO-USE: When detecting or validating test file names
 */
export const testFilePatternStatics = {
  unit: {
    suffixes: ['.test', '.spec'],
  },
  integration: {
    suffixes: ['.integration.test', '.integration.spec'],
  },
  e2e: {
    suffixes: ['.e2e', '.e2e.test', '.e2e.spec'],
  },
  suffixes: [
    '.test',
    '.spec',
    '.integration.test',
    '.integration.spec',
    '.e2e',
    '.e2e.test',
    '.e2e.spec',
  ],
  extensions: ['.ts', '.tsx'],
} as const;
