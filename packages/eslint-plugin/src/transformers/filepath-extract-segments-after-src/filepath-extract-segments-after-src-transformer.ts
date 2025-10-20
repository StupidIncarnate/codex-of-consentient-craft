/**
 * Extracts folder segments from a file path after '/src/', excluding the filename.
 * Example: '/path/src/brokers/rule/foo.ts' -> ['brokers', 'rule']
 */
export const filepathExtractSegmentsAfterSrcTransformer = ({
  filePath,
}: {
  filePath: string;
}): string[] => {
  const afterSrc = filePath.split('/src/')[1];
  if (!afterSrc) return [];
  const parts = afterSrc.split('/');
  return parts.slice(0, -1); // Remove filename, keep folders
};
