import type { FilePath } from '../../contracts/file-path/file-path-contract';
import { testFilePatternStatics } from '../../statics/test-file-pattern/test-file-pattern-statics';

export const isE2eTestFileGuard = ({ filePath }: { filePath: FilePath }): boolean =>
  testFilePatternStatics.e2e.suffixes.some((suffix) => filePath.includes(suffix));
