import { extractedMetadataContract } from '../../contracts/extracted-metadata/extracted-metadata-contract';
import type { ExtractedMetadata } from '../../contracts/extracted-metadata/extracted-metadata-contract';
import type { FileContents } from '../../contracts/file-contents/file-contents-contract';

/**
 * PURPOSE: Extracts structured metadata from comment blocks in source files
 *
 * USAGE:
 * const metadata = metadataExtractorTransformer({
 *   fileContents: FileContentsStub({ value: '/** PURPOSE: Test\n...' })
 * });
 * // Returns: { purpose: 'Test', usage: '...', related: [...], metadata: {...} }
 *
 * RELATED: signatureExtractorTransformer, fileTypeDetectorTransformer
 */
export const metadataExtractorTransformer = ({
  fileContents,
}: {
  fileContents: FileContents;
}): ExtractedMetadata | null => {
  // Match the metadata comment block
  const commentMatch =
    /\/\*\*\s*\n\s*\*\s*PURPOSE:\s*([^\n]+)\s*\n\s*\*\s*\n\s*\*\s*USAGE:\s*\n([\s\S]*?)\n\s*\*\s*\n\s*\*\s*RELATED:\s*([^\n]+)/u.exec(
      fileContents,
    );

  if (!commentMatch) {
    return null;
  }

  const purpose = commentMatch[1]?.trim() ?? '';
  const usageBlock = commentMatch[2] ?? '';
  const relatedLine = commentMatch[3]?.trim() ?? '';

  // Extract usage (remove leading " * " from each line)
  const usage = usageBlock
    .split('\n')
    .map((line) => line.replace(/^\s*\*\s?/u, ''))
    .join('\n')
    .trim();

  // Parse related files (comma-separated)
  const related = relatedLine
    .split(',')
    .map((item) => item.trim())
    .filter((item) => item.length > 0);

  // Extract optional metadata fields (WHEN-TO-USE, WHEN-NOT-TO-USE, RETURNS, etc.)
  const metadataObj: Record<PropertyKey, unknown> = {};

  // Match optional fields that appear after RELATED
  const optionalFieldsPattern =
    /\*\s*(WHEN-TO-USE|WHEN-NOT-TO-USE|RETURNS|PROPS|CONTRACTS|BINDINGS):\s*([^\n]+)/gu;
  let match = optionalFieldsPattern.exec(fileContents);
  while (match !== null) {
    const key = match[1]?.toLowerCase().replace(/-/gu, '') ?? '';
    const value = match[2]?.trim() ?? '';
    if (key && value) {
      metadataObj[key] = value;
    }
    match = optionalFieldsPattern.exec(fileContents);
  }

  return extractedMetadataContract.parse({
    purpose,
    usage,
    related,
    metadata: metadataObj,
  });
};
