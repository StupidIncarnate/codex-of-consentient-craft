import type { FilePath } from '@questmaestro/shared/contracts';
import { filePathContract } from '@questmaestro/shared/contracts';
import { testFilePatternStatics } from '../../statics/test-file-pattern/test-file-pattern-statics';

/**
 * PURPOSE: Generates all possible test file path variants for a given source file
 *
 * USAGE:
 * const testPaths = testFilePathVariantsTransformer({
 *   sourceFilePath: '/src/brokers/user/user-broker.ts'
 * });
 * // Returns: [
 * //   '/src/brokers/user/user-broker.test.ts',
 * //   '/src/brokers/user/user-broker.spec.ts',
 * //   '/src/brokers/user/user-broker.integration.test.ts',
 * //   '/src/brokers/user/user-broker.e2e.test.ts'
 * // ]
 */
export const testFilePathVariantsTransformer = ({
  sourceFilePath,
}: {
  sourceFilePath: string;
}): readonly FilePath[] => {
  // Determine extension
  const extension = sourceFilePath.endsWith('.tsx') ? '.tsx' : '.ts';

  // Remove extension to get base path
  const baseFilePath = sourceFilePath.replace(/\.tsx?$/u, '');

  // Generate all possible test file paths
  return testFilePatternStatics.suffixes.map((suffix) =>
    filePathContract.parse(`${baseFilePath}${suffix}${extension}`),
  );
};
