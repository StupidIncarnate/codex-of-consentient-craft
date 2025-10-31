/**
 * PURPOSE: Determines if a file is a test file based on common test file patterns
 *
 * USAGE:
 * if (isTestFileGuard({ filename: 'user-broker.test.ts' })) {
 *   // Returns true - file is a test file
 * }
 * if (isTestFileGuard({ filename: 'user-broker.ts' })) {
 *   // Returns false - not a test file
 * }
 *
 * WHEN-TO-USE: Use to filter test files from linting rules or to apply test-specific logic
 */
import { testFilePatternStatics } from '../../statics/test-file-pattern/test-file-pattern-statics';

export const isTestFileGuard = ({ filename }: { filename?: string | undefined }): boolean => {
  if (filename === undefined) {
    return false;
  }

  // Generate all possible test file patterns
  const testFilePatterns = testFilePatternStatics.suffixes.flatMap((suffix) =>
    testFilePatternStatics.extensions.map((ext) => `${suffix}${ext}`),
  );

  // Check if filename ends with any test file pattern
  return testFilePatterns.some((pattern) => filename.endsWith(pattern));
};
