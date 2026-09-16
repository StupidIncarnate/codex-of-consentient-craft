/**
 * PURPOSE: Builds the op that puts a row's WHOLE record on the plan's output under a name —
 * server-assigned fields included, because the ids come along inside the record. Reach for this
 * over `opSetTransformer` wherever the row itself is unchanged; saving a row and writing to it are
 * different acts, so this op carries no values, only the name `saveRecordAs` was given.
 *
 * USAGE:
 * opSaveRecordTransformer({ ref: 'guild[0:0]/quest[0:2]', name: 'third' });
 * // Returns { op: 'saveRecord', ref: 'guild[0:0]/quest[0:2]', name: 'third' }
 */
import { opSaveRecordContract } from '../../contracts/op-save-record/op-save-record-contract';
import type { OpSaveRecord } from '../../contracts/op-save-record/op-save-record-contract';
import type { RowRef } from '../../contracts/row-ref/row-ref-contract';
import type { SavedRecordName } from '../../contracts/saved-record-name/saved-record-name-contract';

export const opSaveRecordTransformer = ({
  ref,
  name,
}: {
  ref: RowRef;
  name: SavedRecordName;
}): OpSaveRecord => opSaveRecordContract.parse({ op: 'saveRecord', ref, name });
