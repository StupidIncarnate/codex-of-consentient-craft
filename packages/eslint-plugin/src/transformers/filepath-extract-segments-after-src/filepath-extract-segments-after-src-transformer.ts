/**
 * PURPOSE: Extracts folder path segments after '/src/' directory
 *
 * USAGE:
 * const segments = filepathExtractSegmentsAfterSrcTransformer({
 *   filePath: '/path/src/brokers/rule/foo.ts'
 * });
 * // Returns ['brokers', 'rule']
 * const segments2 = filepathExtractSegmentsAfterSrcTransformer({
 *   filePath: '/project/src/widgets/user-widget.tsx'
 * });
 * // Returns ['widgets']
 *
 * WHEN-TO-USE: When validating folder depth or structure after src directory
 */
import { identifierContract, type Identifier } from '@questmaestro/shared/contracts';

export const filepathExtractSegmentsAfterSrcTransformer = ({
  filePath,
}: {
  filePath: string;
}): Identifier[] => {
  const [, afterSrc] = filePath.split('/src/');
  if (!afterSrc) return [];
  const parts = afterSrc.split('/');
  const folders = parts.slice(0, -1); // Remove filename, keep folders
  return folders.map((folder) => identifierContract.parse(folder));
};
