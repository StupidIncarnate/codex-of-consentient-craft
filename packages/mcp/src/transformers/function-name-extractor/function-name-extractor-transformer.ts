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
import type { FunctionName } from '../../contracts/function-name/function-name-contract';
import { functionNameContract } from '../../contracts/function-name/function-name-contract';

export const functionNameExtractorTransformer = ({
  filepath,
}: {
  filepath: PathSegment;
}): FunctionName => {
  const filename = filepath.split('/').pop() ?? '';
  const nameWithoutExtension = filename.replace(/\.(ts|tsx|js|jsx)$/u, '');
  return functionNameContract.parse(nameWithoutExtension);
};
