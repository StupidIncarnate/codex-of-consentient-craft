/**
 * PURPOSE: Defines the schema for metadata extracted from file documentation comments
 *
 * USAGE:
 * const metadata: ExtractedMetadata = extractedMetadataContract.parse({ purpose: '...', usage: '...', metadata: {} });
 * // Returns validated file metadata with purpose, usage examples, and additional key-value pairs
 */
import { z } from 'zod';

export const extractedMetadataContract = z.object({
  purpose: z.string().brand<'Purpose'>(),
  usage: z.string().brand<'UsageExample'>(),
  metadata: z.record(z.string().brand<'MetadataKey'>(), z.string().brand<'MetadataValue'>()),
});

export type ExtractedMetadata = z.infer<typeof extractedMetadataContract>;
