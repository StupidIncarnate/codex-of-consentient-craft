/**
 * PURPOSE: Names a row's WHOLE record so a later `fromSaved` in the same plan can cross-link to it.
 * Reach for this over `op-set` wherever the row itself is unchanged — this op carries no values,
 * only the name `saveRecordAs` was given, because saving a row and writing to it are different acts.
 *
 * USAGE:
 * opSaveRecordContract.parse({ op: 'saveRecord', ref: 'guild[0:0]/quest[0:2]', name: 'third' });
 * // Returns an OpSaveRecord
 */
import { z } from '#gateway/npm/zod';
import { rowRefContract } from '../row-ref/row-ref-contract';

export const opSaveRecordContract = z.object({
  op: z.literal('saveRecord'),
  ref: rowRefContract,
  name: z.string().min(1).brand<'OpSaveRecordName'>(),
});

export type OpSaveRecord = z.infer<typeof opSaveRecordContract>;
