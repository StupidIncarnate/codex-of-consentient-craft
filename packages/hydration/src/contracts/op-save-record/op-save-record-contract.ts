/**
 * PURPOSE: Names a row's WHOLE record so a later `fromSaved` in the same plan can cross-link to it.
 * Reach for this over `op-set` wherever the row itself is unchanged — this op carries no values,
 * only the name `saveRecordAs` was given, because saving a row and writing to it are different acts.
 *
 * USAGE:
 * opSaveRecordContract.parse({ op: 'saveRecord', ref: 'guild[0:0]/quest[0:2]', name: 'third' });
 * // Returns an OpSaveRecord
 */
import { z } from 'zod';
import { rowRefContract } from '../row-ref/row-ref-contract';
import { savedRecordNameContract } from '../saved-record-name/saved-record-name-contract';

export const opSaveRecordContract = z.object({
  op: z.literal('saveRecord'),
  ref: rowRefContract,
  name: savedRecordNameContract,
});

export type OpSaveRecord = z.infer<typeof opSaveRecordContract>;
