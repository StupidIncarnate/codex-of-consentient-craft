import type { FilePath } from '@questmaestro/shared/contracts';
import { testFilePatternStatics } from '../../statics/test-file-pattern/test-file-pattern-statics';

/**
 * PURPOSE: Checks if a file path represents an end-to-end test file
 *
 * USAGE:
 * if (isE2eTestFileGuard({ filePath: 'src/tests/e2e/login.e2e.test.ts' as FilePath })) {
 *   // File is an e2e test file
 * }
 * // Returns true if path contains any e2e test file suffix from test file pattern statics
 */
export const isE2eTestFileGuard = ({ filePath }: { filePath?: FilePath | undefined }): boolean => {
  if (filePath === undefined) {
    return false;
  }

  return testFilePatternStatics.e2e.suffixes.some((suffix) => filePath.includes(suffix));
};
