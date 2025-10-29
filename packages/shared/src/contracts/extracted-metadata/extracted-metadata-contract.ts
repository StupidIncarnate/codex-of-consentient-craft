import { z } from 'zod';

/**
 * PURPOSE: Defines structure for metadata extracted from file comment blocks
 *
 * USAGE:
 * import type { ExtractedMetadata } from '@questmaestro/shared';
 * const metadata: ExtractedMetadata = { purpose: '...', usage: '...', ... };
 */
export const extractedMetadataContract = z.object({
  purpose: z.string().brand<'Purpose'>(),
  usage: z.string().brand<'UsageExample'>(),
  metadata: z.record(z.string().brand<'MetadataKey'>(), z.unknown()),
});

export type ExtractedMetadata = z.infer<typeof extractedMetadataContract>;
