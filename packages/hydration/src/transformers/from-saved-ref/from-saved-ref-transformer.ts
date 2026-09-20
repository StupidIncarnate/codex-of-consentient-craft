/**
 * PURPOSE: Points a field at a row the chain cannot reach directly, by the name an earlier
 * `saveRecordAs` gave it. Reach for this only for a CROSS-link; reach for `rowRefTransformer`
 * instead wherever the target is an ancestor already on the chain — the runner fills that kind of
 * link on its own from the plan's `links` declarations, and never from a saved name.
 *
 * USAGE:
 * fromSavedRefTransformer({ name: 'origin', field: 'sessionId' });
 * // Returns { __savedRef: true, name: 'origin', field: 'sessionId' }
 */
import { savedRefContract } from '../../contracts/saved-ref/saved-ref-contract';
import type { SavedRef } from '../../contracts/saved-ref/saved-ref-contract';
import type { SavedRecordName } from '../../contracts/saved-record-name/saved-record-name-contract';
import type { FieldName } from '../../contracts/field-name/field-name-contract';

export const fromSavedRefTransformer = ({
  name,
  field,
}: {
  name: SavedRecordName;
  field?: FieldName;
}): SavedRef =>
  savedRefContract.parse({
    __savedRef: true,
    name,
    ...(field === undefined ? {} : { field }),
  });
