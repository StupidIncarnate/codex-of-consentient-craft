/**
 * PURPOSE: Builds the op that deletes exactly the row `ref` names — a row the chain resolved
 * directly, or `matchedRef`, the placeholder `opFilterTransformer` hands the nested ops it runs once
 * per row it finds at run time. Reach for this over `opSetTransformer` wherever a row is being taken
 * OUT rather than written to.
 *
 * USAGE:
 * opRemoveTransformer({ ref: 'guild[0:0]/quest[0:1]' });
 * // Returns { op: 'remove', ref: 'guild[0:0]/quest[0:1]' }
 */
import { opRemoveContract } from '../../contracts/op-remove/op-remove-contract';
import type { OpRemove } from '../../contracts/op-remove/op-remove-contract';
import type { RowRef } from '../../contracts/row-ref/row-ref-contract';

export const opRemoveTransformer = ({ ref }: { ref: RowRef }): OpRemove =>
  opRemoveContract.parse({ op: 'remove', ref });
