/**
 * PURPOSE: Defines structure for metadata extracted from file comment blocks
 *
 * USAGE:
 * import type { ExtractedMetadata } from '@dungeonmaster/shared/contracts';
 * const metadata: ExtractedMetadata = { purpose: '...', usage: '...', ... };
 */
import { z } from '#gateway/npm/zod';

export const extractedMetadataContract = z.object({
  purpose: z.string().brand<'ExtractedMetadataPurpose'>(),
  usage: z.string().brand<'ExtractedMetadataUsage'>(),
  metadata: z.record(z.string(), z.json()),
}).brand<'ExtractedMetadata'>();

export type ExtractedMetadata = z.infer<typeof extractedMetadataContract>;
