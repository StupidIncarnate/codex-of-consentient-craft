/**
 * PURPOSE: Zod schema for content change with old and new content
 *
 * USAGE:
 * const change = contentChangeContract.parse({ oldContent, newContent });
 * // Returns validated ContentChange with branded FileContents
 */
import { z } from 'zod';
import { fileContentsContract } from '../file-contents/file-contents-contract';

export const contentChangeContract = z.object({
  oldContent: fileContentsContract,
  newContent: fileContentsContract,
});

export type ContentChange = z.infer<typeof contentChangeContract>;
