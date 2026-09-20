/**
 * PURPOSE: Deletes the row `ref` names, cascading eviction of all descendant records in memory and
 * calling child `remove` routes in reverse-depth order before the parent's `remove` route executes.
 * Reach for this over plain record deletion wherever a row is being taken OUT rather than written
 * to — the pre-flight already refused a `remove` against an ingredient with no `remove` route (Q2),
 * so this layer's own job is to call child routes from deepest to shallowest, remove the parent,
 * and drop all corresponding rows from the walk's state.
 *
 * USAGE:
 * await opRemoveApplyLayerBroker({ op, target, config, ingredients, state });
 * // Returns the mutated state, with state.records no longer holding op.ref or any descendant refs
 */
import { rowRefIngredientTransformer } from '../../../transformers/row-ref-ingredient/row-ref-ingredient-transformer';
import type { OpRemove } from '../../../contracts/op-remove/op-remove-contract';
import type { HydrationTarget } from '../../../contracts/hydration-target/hydration-target-contract';
import type { IngredientConfigData } from '../../../contracts/ingredient-config/ingredient-config-contract';
import type { IngredientName } from '../../../contracts/ingredient-name/ingredient-name-contract';
import type { HydrationRunState } from '../../../contracts/hydration-run-state/hydration-run-state-contract';

export const opRemoveApplyLayerBroker = async ({
  op,
  target,
  config,
  ingredients,
  state,
}: {
  op: OpRemove;
  target: HydrationTarget;
  config: IngredientConfigData;
  ingredients?: readonly IngredientConfigData[];
  state: HydrationRunState;
}): Promise<HydrationRunState> => {
  const configByName = new Map<IngredientName, IngredientConfigData>(
    (ingredients ?? [config]).map((candidate) => [candidate.name, candidate] as const),
  );

  const prefix = `${op.ref}/`;
  const descendantRefs = [...state.records.keys()].filter((key) => key.startsWith(prefix));
  descendantRefs.sort((a, b) => b.split('/').length - a.split('/').length);

  await descendantRefs.reduce(async (previous, childRef) => {
    await previous;
    const childRecord = state.records.get(childRef);
    const childIngredientName = rowRefIngredientTransformer({ rowRef: childRef });
    const childConfig = configByName.get(childIngredientName);
    if (childConfig?.routes.remove !== undefined && childRecord !== undefined) {
      await childConfig.routes.remove({ target, record: childRecord as Record<string, unknown> });
    }
    state.records.delete(childRef);
  }, Promise.resolve());

  const record = state.records.get(op.ref);
  // Total by construction — the pre-flight refuses a `remove` op against an ingredient with no
  // `remove` route before the walk ever starts (Q2's ruling).
  await config.routes.remove?.({ target, record: (record ?? {}) as Record<string, unknown> });
  state.records.delete(op.ref);
  return state;
};
