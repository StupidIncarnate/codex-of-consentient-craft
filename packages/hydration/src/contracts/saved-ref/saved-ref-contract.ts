/**
 * PURPOSE: A cross-link to a row the tree cannot reach, as DATA the runner resolves at run time.
 * Reach for this over a `links` entry wherever the parent named is NOT an ancestor of the row
 * being built — a link is structural and the runner fills it walking the plan depth-first; a
 * saved ref is a name pointing sideways, at a row an earlier `saveRecordAs` in the same plan
 * named.
 *
 * USAGE:
 * savedRefContract.parse({ __savedRef: true, name: 'origin', field: 'sessionId' });
 * // Returns a SavedRef
 */
import { z } from 'zod';
import { savedRecordNameContract } from '../saved-record-name/saved-record-name-contract';
import { fieldNameContract } from '../field-name/field-name-contract';

export const savedRefContract = z.object({
  __savedRef: z.literal(true),
  name: savedRecordNameContract,
  field: fieldNameContract.optional(),
});

export type SavedRef = z.infer<typeof savedRefContract>;
