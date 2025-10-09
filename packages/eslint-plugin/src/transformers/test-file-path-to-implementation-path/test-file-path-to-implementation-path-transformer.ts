import type { FilePath } from '@questmaestro/shared/contracts';
import { filePathContract } from '@questmaestro/shared/contracts';
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
