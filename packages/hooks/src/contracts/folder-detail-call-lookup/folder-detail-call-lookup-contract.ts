/**
 * PURPOSE: Defines the tri-state result of scanning a transcript for a `get-folder-detail` call —
 * keeps "the transcript records no such call" (`not-called`, the only value that may block a
 * write) distinct from "the transcript could not be read or parsed" (`undetermined`, which
 * always allows). A plain boolean would collapse those two and turn a read failure into a block.
 *
 * USAGE:
 * folderDetailCallLookupContract.parse('not-called');
 * // Returns: FolderDetailCallLookup enum value
 */
import { z } from 'zod';

export const folderDetailCallLookupContract = z.enum(['called', 'not-called', 'undetermined']);

export type FolderDetailCallLookup = z.infer<typeof folderDetailCallLookupContract>;
