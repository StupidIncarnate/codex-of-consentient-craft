import { z } from 'zod';

/**
 * File metadata comment structure extracted from JSDoc/block comments
 * Required fields: PURPOSE, USAGE
 * Optional fields: RELATED, WHEN-TO-USE, WHEN-NOT-TO-USE, RETURNS, PROPS, BINDINGS, CONTRACTS
 */
export const fileMetadataCommentContract = z.object({
  purpose: z.string().min(1).brand<'MetadataPurpose'>(),
  usage: z.string().min(1).brand<'MetadataUsage'>(),
  related: z.string().optional().brand<'MetadataRelated'>(),
});

export type FileMetadataComment = z.infer<typeof fileMetadataCommentContract>;
