/**
 * File metadata comment structure extracted from JSDoc/block comments
 * Required fields: PURPOSE, USAGE
 * Optional fields: WHEN-TO-USE, WHEN-NOT-TO-USE, RETURNS, PROPS, BINDINGS, CONTRACTS
 *
 * PURPOSE: Validates file metadata comment structure with required PURPOSE and USAGE fields
 *
 * USAGE:
 * const metadata = fileMetadataCommentContract.parse({ purpose: 'Does X', usage: 'const x = func()' });
 * // Returns validated FileMetadataComment with branded strings
 */
import { z } from 'zod';

export const fileMetadataCommentContract = z.object({
  purpose: z.string().min(1).brand<'MetadataPurpose'>(),
  usage: z.string().min(1).brand<'MetadataUsage'>(),
});

export type FileMetadataComment = z.infer<typeof fileMetadataCommentContract>;
