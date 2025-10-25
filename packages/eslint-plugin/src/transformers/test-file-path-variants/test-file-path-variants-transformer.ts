import type { FilePath } from '@questmaestro/shared/contracts';
import { filePathContract } from '@questmaestro/shared/contracts';
import { testFilePatternStatics } from '../../statics/test-file-pattern/test-file-pattern-statics';

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
