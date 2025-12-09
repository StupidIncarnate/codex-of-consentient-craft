/**
 * PURPOSE: Defines structure for metadata extracted from file comment blocks
 *
 * USAGE:
 * import type { ExtractedMetadata } from '@dungeonmaster/shared';
 * const metadata: ExtractedMetadata = { purpose: '...', usage: '...', ... };
 */
import { z } from 'zod';

export const extractedMetadataContract = z.object({
  purpose: z.string().brand<'Purpose'>(),
  usage: z.string().brand<'UsageExample'>(),
  metadata: z.record(z.string().brand<'MetadataKey'>(), z.unknown()),
});

export type ExtractedMetadata = z.infer<typeof extractedMetadataContract>;
