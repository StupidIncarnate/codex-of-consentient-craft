/**
 * PURPOSE: Extracts function name from filepath by removing extension
 *
 * USAGE:
 * const name = functionNameExtractorTransformer({
 *   filepath: PathSegmentStub({ value: '/path/to/user-fetch-broker.ts' })
 * });
 * // Returns: FunctionName('user-fetch-broker')
 */

export const functionNameExtractorTransformer = ({ filepath }: { filepath: string }): string => {
  const filename = filepath.split('/').pop() ?? '';
  const nameWithoutExtension = filename.replace(/\.(ts|tsx|js|jsx)$/u, '');
  return nameWithoutExtension;
};
