/**
 * PURPOSE: Extracts structured metadata from comment blocks in source files (wrapper for shared implementation)
 *
 * USAGE:
 * const metadata = metadataExtractorTransformer({
 *   fileContents: FileContentsStub({ value: '/** PURPOSE: Test\n...' })
 * });
 * // Returns: { purpose: 'Test', usage: '...', metadata: {...} }
 */
import { metadataExtractorTransformer as sharedMetadataExtractor } from '@dungeonmaster/shared/transformers';
import type { ExtractedMetadata } from '@dungeonmaster/shared/contracts';
import type { FileContents } from '../../contracts/file-contents/file-contents-contract';

export const metadataExtractorTransformer = ({
  fileContents,
}: {
  fileContents: FileContents;
}): ExtractedMetadata | null =>
  // Delegate to shared implementation
  sharedMetadataExtractor({ commentText: String(fileContents) });
