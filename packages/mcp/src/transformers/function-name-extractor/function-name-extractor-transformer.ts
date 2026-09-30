/**
 * PURPOSE: Extracts function name from filepath by removing extension
 *
 * USAGE:
 * const name = functionNameExtractorTransformer({
 *   filepath: PathSegmentStub({ value: '/path/to/user-fetch-broker.ts' })
 * });
 * // Returns: FunctionName('user-fetch-broker')
 */
import type { PathSegment } from '@dungeonmaster/shared/contracts';

export const functionNameExtractorTransformer = ({
  filepath,
}: {
  filepath: PathSegment;
}): string => {
  const filename = filepath.split('/').pop() ?? '';
  const nameWithoutExtension = filename.replace(/\.(ts|tsx|js|jsx)$/u, '');
  return nameWithoutExtension;
};
