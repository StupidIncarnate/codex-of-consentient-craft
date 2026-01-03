/**
 * PURPOSE: Checks if a file path represents an integration test file
 *
 * USAGE:
 * if (isIntegrationTestFileGuard({ filePath: 'src/startup/start-cli.integration.test.ts' as FilePath })) {
 *   // File is an integration test file
 * }
 * // Returns true if path contains any integration test file suffix from test file pattern statics
 */
import type { FilePath } from '@dungeonmaster/shared/contracts';
import { testFilePatternStatics } from '../../statics/test-file-pattern/test-file-pattern-statics';

export const isIntegrationTestFileGuard = ({
  filePath,
}: {
  filePath?: FilePath | undefined;
}): boolean => {
  if (filePath === undefined) {
    return false;
  }

  return testFilePatternStatics.integration.suffixes.some((suffix) => filePath.includes(suffix));
};
