import { extractedMetadataContract } from '../../contracts/extracted-metadata/extracted-metadata-contract';
import type { ExtractedMetadata } from '../../contracts/extracted-metadata/extracted-metadata-contract';

/**
 * PURPOSE: Extracts structured metadata from comment blocks in source files
 *
 * USAGE:
 * const metadata = metadataExtractorTransformer({
 *   commentText: '/** \n * PURPOSE: Test\n * USAGE: test()\n * *\/'
 * });
 * // Returns: { purpose: 'Test', usage: 'test()', metadata: {} }
 */
export const metadataExtractorTransformer = ({
  commentText,
}: {
  commentText: string;
}): ExtractedMetadata | null => {
  // Normalize comment text - handle both full comment blocks (/** ... */) and content-only (from ESLint)
  // ESLint's AST gives comment.value without /** and */ markers
  const normalizedComment = commentText.startsWith('/**') ? commentText : `/**${commentText}*/`;

  // Extract PURPOSE (single line, order-independent)
  const purposeMatch = /PURPOSE:\s*([^\n*]+?)(?:\s*\*?\s*\n|\s*\*\/|$)/u.exec(normalizedComment);
  if (!purposeMatch?.[1]) {
    return null;
  }
  const purpose = purposeMatch[1].trim();

  // Check if purpose is non-empty
  if (purpose.length === 0 || purpose === '*') {
    return null;
  }

  // Extract USAGE (multi-line, stops at next field header or end of comment)
  // Match from "USAGE:" to the next field header (any known field) or end of comment block
  const usageMatch =
    /USAGE:\s*([\s\S]*?)(?:\s*\*\s*(?:PURPOSE|WHEN-TO-USE|WHEN-NOT-TO-USE|RETURNS|PROPS|CONTRACTS|BINDINGS):|\s*\*\/)/u.exec(
      normalizedComment,
    );
  if (!usageMatch?.[1]) {
    return null;
  }
  const [, usageBlock] = usageMatch;

  // Clean up USAGE text (remove leading " * " from each line)
  const usage = usageBlock
    .split('\n')
    .map((line) => line.replace(/^\s*\*\s?/u, '').trim())
    .filter((line) => line.length > 0 && line !== '/')
    .join('\n')
    .replace(/\*\/\s*$/u, '') // Remove trailing */
    .trim();

  // Check if usage is non-empty
  if (usage.length === 0 || usage === '/') {
    return null;
  }

  // Extract optional metadata fields
  const metadataObj: Record<PropertyKey, unknown> = {};
  const optionalFieldsPattern =
    /\*?\s*(WHEN-TO-USE|WHEN-NOT-TO-USE|RETURNS|PROPS|CONTRACTS|BINDINGS):\s*([^\n]+)/gu;
  let match = optionalFieldsPattern.exec(normalizedComment);
  while (match !== null) {
    const key = match[1]?.toLowerCase().replace(/-/gu, '') ?? '';
    const value = match[2]?.trim() ?? '';
    if (key && value) {
      metadataObj[key] = value;
    }
    match = optionalFieldsPattern.exec(normalizedComment);
  }

  return extractedMetadataContract.parse({
    purpose,
    usage,
    metadata: metadataObj,
  });
};
