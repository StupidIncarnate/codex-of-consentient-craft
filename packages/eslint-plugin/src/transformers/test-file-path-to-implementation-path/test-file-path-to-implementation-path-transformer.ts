/**
 * PURPOSE: Converts a test file path to its corresponding implementation file path by removing test suffixes
 *
 * USAGE:
 * const implPath = testFilePathToImplementationPathTransformer({
 *   testFilePath: '/src/brokers/user/user-broker.test.ts'
 * });
 * // Returns: '/src/brokers/user/user-broker.ts'
 *
 * const integrationImpl = testFilePathToImplementationPathTransformer({
 *   testFilePath: '/src/adapters/http/http-adapter.integration.test.ts'
 * });
 * // Returns: '/src/adapters/http/http-adapter.ts'
 */
import type { FilePath } from '@dungeonmaster/shared/contracts';
import { filePathContract } from '@dungeonmaster/shared/contracts';
import { testFilePatternStatics } from '../../statics/test-file-pattern/test-file-pattern-statics';

export const testFilePathToImplementationPathTransformer = ({
  testFilePath,
}: {
  testFilePath: FilePath;
}): FilePath => {
  let implementationPath = testFilePath;

  // Sort suffixes by length (longest first) to handle compound suffixes like .integration.test before .test
  const sortedSuffixes = [...testFilePatternStatics.suffixes].sort((a, b) => b.length - a.length);

  // Remove test suffix (.integration.test, .e2e.test, .test, .spec, etc.)
  for (const suffix of sortedSuffixes) {
    if (implementationPath.includes(suffix)) {
      implementationPath = implementationPath.replace(suffix, '') as FilePath;
      break;
    }
  }

  return filePathContract.parse(implementationPath);
};
