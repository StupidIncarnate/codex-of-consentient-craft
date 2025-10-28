import { metadataExtractorTransformer as sharedMetadataExtractor } from '@questmaestro/shared/transformers';
import type { ExtractedMetadata } from '@questmaestro/shared/contracts';
import type { FileContents } from '../../contracts/file-contents/file-contents-contract';

/**
 * PURPOSE: Extracts structured metadata from comment blocks in source files (wrapper for shared implementation)
 *
 * USAGE:
 * const metadata = metadataExtractorTransformer({
 *   fileContents: FileContentsStub({ value: '/** PURPOSE: Test\n...' })
 * });
 * // Returns: { purpose: 'Test', usage: '...', related: [...], metadata: {...} }
 *
 * RELATED: @questmaestro/shared/transformers, signatureExtractorTransformer, fileTypeDetectorTransformer
 */
export const metadataExtractorTransformer = ({
  fileContents,
}: {
  fileContents: FileContents;
}): ExtractedMetadata | null => {
  // Delegate to shared implementation
  return sharedMetadataExtractor({ commentText: String(fileContents) });
};
