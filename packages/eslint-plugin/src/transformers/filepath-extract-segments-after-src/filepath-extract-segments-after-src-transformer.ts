import { identifierContract, type Identifier } from '@questmaestro/shared/contracts';

/**
 * Extracts folder segments from a file path after '/src/', excluding the filename.
 * Example: '/path/src/brokers/rule/foo.ts' -> ['brokers', 'rule']
 */
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
