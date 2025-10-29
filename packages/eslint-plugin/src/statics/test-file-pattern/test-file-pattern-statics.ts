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
    suffixes: ['.e2e.test', '.e2e.spec'],
  },
  suffixes: ['.test', '.spec', '.integration.test', '.integration.spec', '.e2e.test', '.e2e.spec'],
  extensions: ['.ts', '.tsx'],
} as const;
