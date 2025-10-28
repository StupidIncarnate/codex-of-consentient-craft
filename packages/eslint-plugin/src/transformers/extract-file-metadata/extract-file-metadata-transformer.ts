import { fileMetadataCommentContract } from '../../contracts/file-metadata-comment/file-metadata-comment-contract';
import type { FileMetadataComment } from '../../contracts/file-metadata-comment/file-metadata-comment-contract';

/**
 * PURPOSE: Extracts PURPOSE, USAGE, and optional RELATED fields from comment text
 *
 * USAGE:
 * const metadata = extractFileMetadataTransformer({ commentText: '/** \n * PURPOSE: Does something\n * USAGE: example()\n *\/' });
 * // Returns { purpose: 'Does something', usage: 'example()', related: undefined }
 *
 * RELATED: has-file-metadata-comment-guard, file-metadata-comment-contract
 */
export const extractFileMetadataTransformer = ({
  commentText,
}: {
  commentText: string;
}): FileMetadataComment | null => {
  // Extract PURPOSE field (required)
  // Match until newline, but exclude trailing */ and *
  const purposeMatch = /PURPOSE:\s*([^\n*]+?)(?:\s*\*?\s*\n|\s*\*\/|$)/u.exec(commentText);
  if (!purposeMatch?.[1]) {
    return null;
  }
  const purpose = purposeMatch[1].trim();

  // Check if purpose is non-empty (not just whitespace or *)
  if (purpose.length === 0 || purpose === '*') {
    return null;
  }

  // Extract USAGE field (required)
  // USAGE can span multiple lines until the next field or end of comment
  const usageMatch =
    /USAGE:\s*([\s\S]*?)(?:\n\s*\*\s*(?:RELATED|WHEN-TO-USE|WHEN-NOT-TO-USE|RETURNS|PROPS|BINDINGS|CONTRACTS):|$)/u.exec(
      commentText,
    );
  if (!usageMatch?.[1]) {
    return null;
  }

  const usage = usageMatch[1]
    .split('\n')
    .map((line) => line.replace(/^\s*\*\s?/u, '').trim())
    .filter((line) => line.length > 0 && line !== '/')
    .join('\n')
    .replace(/\*\/\s*$/u, '') // Remove trailing */
    .trim();

  // Check if usage is non-empty (not just / or whitespace)
  if (usage.length === 0 || usage === '/') {
    return null;
  }

  // Extract RELATED field (optional)
  const relatedMatch = /RELATED:\s*([^\n*]+?)(?:\s*\*?\s*\n|\s*\*\/|$)/u.exec(commentText);
  const related = relatedMatch?.[1]?.trim();

  return fileMetadataCommentContract.parse({
    purpose,
    usage,
    ...(related ? { related } : {}),
  });
};
