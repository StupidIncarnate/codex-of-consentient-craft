import type { FilePath } from '../../contracts/file-path/file-path-contract';
import type { FunctionName } from '../../contracts/function-name/function-name-contract';
import { functionNameContract } from '../../contracts/function-name/function-name-contract';

/**
 * PURPOSE: Extracts function name from filepath by removing extension
 *
 * USAGE:
 * const name = functionNameExtractorTransformer({
 *   filepath: FilePathStub({ value: '/path/to/user-fetch-broker.ts' })
 * });
 * // Returns: FunctionName('user-fetch-broker')
 */
export const functionNameExtractorTransformer = ({
  filepath,
}: {
  filepath: FilePath;
}): FunctionName => {
  const filename = filepath.split('/').pop() ?? '';
  const nameWithoutExtension = filename.replace(/\.tsx?$/u, '');
  return functionNameContract.parse(nameWithoutExtension);
};
