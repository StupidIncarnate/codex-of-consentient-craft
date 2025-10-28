import { z } from 'zod';

/**
 * PURPOSE: Defines structure for metadata extracted from file comment blocks
 *
 * USAGE:
 * import type { ExtractedMetadata } from '@questmaestro/shared';
 * const metadata: ExtractedMetadata = { purpose: '...', usage: '...', ... };
 *
 * RELATED: metadata-extractor-transformer
 */
export const extractedMetadataContract = z.object({
  purpose: z.string().brand<'Purpose'>(),
  usage: z.string().brand<'UsageExample'>(),
  related: z.array(z.string().brand<'RelatedFile'>()),
  metadata: z.record(z.string().brand<'MetadataKey'>(), z.unknown()),
});

export type ExtractedMetadata = z.infer<typeof extractedMetadataContract>;
