/**
 * PURPOSE: Builds the op that brings one EXISTING row into scope — the `where` match the runner
 * hands to the ingredient's own `query` route, and the ancestor chain the runner walks to fill the
 * `links` of whatever this op's own builder mints underneath it. The row's own `ref` is DERIVED
 * here from `ingredient`, `callIndex` and `ancestors` via `rowRefTransformer`, exactly as
 * `opCreateTransformer` derives one for a row it mints — an attach op needs an `index` too (every
 * `RowRef` segment carries one), and it is always `0`: `attach` binds ONE row per call, never a
 * tuple `add(n, …)` counts.
 *
 * USAGE:
 * opAttachTransformer({ ingredient: 'quest', callIndex: 0, ancestors: [], where: { id: 'q1' } });
 * // Returns { op: 'attach', ingredient: 'quest', ref: 'quest[0:0]', ancestors: [], where: { id: 'q1' } }
 */
import { opAttachContract } from '../../contracts/op-attach/op-attach-contract';
import type { OpAttach } from '../../contracts/op-attach/op-attach-contract';
import type { CallIndex } from '../../contracts/call-index/call-index-contract';
import type { FieldValues } from '../../contracts/field-values/field-values-contract';
import { rowRefTransformer } from '../row-ref/row-ref-transformer';

const ATTACH_ROW_INDEX = 0;

export const opAttachTransformer = ({
  ingredient,
  callIndex,
  ancestors,
  where,
}: {
  ingredient: string;
  callIndex: CallIndex;
  ancestors: readonly string[];
  where: FieldValues;
}): OpAttach => {
  const ref = rowRefTransformer({ ancestors, ingredient, callIndex, index: ATTACH_ROW_INDEX });

  return opAttachContract.parse({
    op: 'attach',
    ingredient,
    ref,
    ancestors,
    where,
  });
};
