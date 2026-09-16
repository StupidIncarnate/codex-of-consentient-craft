/**
 * PURPOSE: Runs a verb only one ingredient could have. Reach for this over the other layers for any
 * chain call the framework does not name itself — an `extras` entry is declared as `{ args, apply }`
 * (Q3's ruling), and this layer resolves the row's cross-links, then calls the ingredient's own
 * `apply` with the row's current record and the resolved args.
 *
 * USAGE:
 * await opExtraApplyLayerBroker({ op, target, config, state });
 * // Calls config.extras[op.verb].apply({ target, record, args })
 */
import { fieldValuesResolveTransformer } from '../../../transformers/field-values-resolve/field-values-resolve-transformer';
import type { OpExtra } from '../../../contracts/op-extra/op-extra-contract';
import type { HydrationTarget } from '../../../contracts/hydration-target/hydration-target-contract';
import type { IngredientConfigData } from '../../../contracts/ingredient-config/ingredient-config-contract';
import type { HydrationRunState } from '../../../contracts/hydration-run-state/hydration-run-state-contract';

export const opExtraApplyLayerBroker = async ({
  op,
  target,
  config,
  state,
}: {
  op: OpExtra;
  target: HydrationTarget;
  config: IngredientConfigData;
  state: HydrationRunState;
}): Promise<HydrationRunState> => {
  const record = (state.records.get(op.ref) ?? {}) as Record<string, unknown>;
  const args = fieldValuesResolveTransformer({ values: op.args, saved: state.saved });

  // Total by construction — a plan calling a verb the ingredient never declared does not compile,
  // and `ingredientDeclareBroker` refuses one shadowing a reserved verb at declare time.
  await config.extras?.[op.verb]?.apply({ target, record, args });
  return state;
};
