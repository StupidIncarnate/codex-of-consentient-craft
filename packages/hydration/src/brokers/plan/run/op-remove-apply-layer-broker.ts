/**
 * PURPOSE: Deletes exactly the row `ref` names, or every row a filter matched. Reach for this
 * wherever a row is being taken OUT rather than written to — the pre-flight already refused a
 * `remove` against an ingredient with no `remove` route (Q2), so this layer's own job is only to
 * call it with the row's current record and drop the row from the walk's state.
 *
 * USAGE:
 * await opRemoveApplyLayerBroker({ op, target, config, state });
 * // Returns the mutated state, with state.records no longer holding op.ref
 */
import type { OpRemove } from '../../../contracts/op-remove/op-remove-contract';
import type { HydrationTarget } from '../../../contracts/hydration-target/hydration-target-contract';
import type { IngredientConfigData } from '../../../contracts/ingredient-config/ingredient-config-contract';
import type { HydrationRunState } from '../../../contracts/hydration-run-state/hydration-run-state-contract';

export const opRemoveApplyLayerBroker = async ({
  op,
  target,
  config,
  state,
}: {
  op: OpRemove;
  target: HydrationTarget;
  config: IngredientConfigData;
  state: HydrationRunState;
}): Promise<HydrationRunState> => {
  const record = state.records.get(op.ref);
  // Total by construction — the pre-flight refuses a `remove` op against an ingredient with no
  // `remove` route before the walk ever starts (Q2's ruling).
  await config.routes.remove?.({ target, record: (record ?? {}) as Record<string, unknown> });
  state.records.delete(op.ref);
  return state;
};
