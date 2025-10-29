import { z } from 'zod';

export const extractedMetadataContract = z.object({
  purpose: z.string().brand<'Purpose'>(),
  usage: z.string().brand<'UsageExample'>(),
  metadata: z.record(z.string().brand<'MetadataKey'>(), z.string().brand<'MetadataValue'>()),
});

export type ExtractedMetadata = z.infer<typeof extractedMetadataContract>;
