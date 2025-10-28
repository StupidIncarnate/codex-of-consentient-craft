import { metadataExtractorTransformer } from '@questmaestro/shared/transformers';
import { fileMetadataCommentContract } from '../../contracts/file-metadata-comment/file-metadata-comment-contract';
import type { FileMetadataComment } from '../../contracts/file-metadata-comment/file-metadata-comment-contract';

/**
 * PURPOSE: Extracts PURPOSE, USAGE, and optional RELATED fields from comment text (wrapper for shared implementation)
 *
 * USAGE:
 * const metadata = extractFileMetadataTransformer({ commentText: '/** \n * PURPOSE: Does something\n * USAGE: example()\n *\/' });
 * // Returns { purpose: 'Does something', usage: 'example()', related: 'related-file' }
 *
 * RELATED: @questmaestro/shared/transformers, has-file-metadata-comment-guard, file-metadata-comment-contract
 */
export const extractFileMetadataTransformer = ({
  commentText,
}: {
  commentText: string;
}): FileMetadataComment | null => {
  // Delegate to shared implementation
  // The shared version handles both full comment blocks (/** ... */) and content-only (from ESLint)
  const sharedResult = metadataExtractorTransformer({ commentText });

  if (!sharedResult) {
    return null;
  }

  // Convert shared format to ESLint plugin format
  // ESLint plugin expects RELATED as a single string, not an array
  return fileMetadataCommentContract.parse({
    purpose: sharedResult.purpose,
    usage: sharedResult.usage,
    ...(sharedResult.related.length > 0 ? { related: sharedResult.related.join(', ') } : {}),
  });
};
