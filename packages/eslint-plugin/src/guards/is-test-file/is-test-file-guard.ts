import { testFilePatternStatics } from '../../statics/test-file-pattern/test-file-pattern-statics';

export const isTestFileGuard = ({ filename }: { filename: string }): boolean => {
  // Generate all possible test file patterns
  const testFilePatterns = testFilePatternStatics.suffixes.flatMap((suffix) =>
    testFilePatternStatics.extensions.map((ext) => `${suffix}${ext}`),
  );

  // Check if filename ends with any test file pattern
  return testFilePatterns.some((pattern) => filename.endsWith(pattern));
};
