/**
 * PURPOSE: Applies the TRANSITION half of a `set` op — walking a row through the ingredient's own
 * gates rather than writing a value onto it directly. Reach for `opCreateApplyLayerBroker` for the
 * WRITTEN half instead: `planFoldWritesTransformer` has already folded a foldable `set`'s plain
 * fields into the `create` that mints the same row, so a `set` reaching this broker with a non-empty
 * `written` is one the fold refused — an update, which is Q2's ruling and belongs to chunk 6's
 * `opUpdateApplyLayerBroker`, not this layer. A `set` with no `transition` key at all (an ordinary
 * `setRaw`, or an update this layer is not the owner of) is a no-op here.
 *
 * A `to` off the ingredient's own list never reaches this broker: `planPreflightBroker` refuses that
 * SHAPE mismatch before the first write, since both the asked-for `to` and the ingredient's own list
 * are known off the plan alone. What still runs here is the RESULT half — `reach` itself, a live
 * gate over the row's actual current state — which no pre-flight can know in advance.
 *
 * USAGE:
 * await opSetApplyLayerBroker({ op, target, config, state });
 * // Returns the mutated state, with state.records.get(op.ref) now holding what `reach` produced
 */
import { rowRefIngredientTransformer } from '../../../transformers/row-ref-ingredient/row-ref-ingredient-transformer';
import { transitionFromTransformer } from '../../../transformers/transition-from/transition-from-transformer';
import { HydrationTransitionRefusedError } from '../../../errors/hydration-transition-refused/hydration-transition-refused-error';
import type { OpSet } from '../../../contracts/op-set/op-set-contract';
import type { HydrationTarget } from '../../../contracts/hydration-target/hydration-target-contract';
import type { IngredientConfigData } from '../../../contracts/ingredient-config/ingredient-config-contract';
import type { HydrationRunState } from '../../../contracts/hydration-run-state/hydration-run-state-contract';

export const opSetApplyLayerBroker = async ({
  op,
  target,
  config,
  state,
}: {
  op: OpSet;
  target: HydrationTarget;
  config: IngredientConfigData;
  state: HydrationRunState;
}): Promise<HydrationRunState> => {
  const transitionSpec = config.transitions;
  if (op.transition === undefined || transitionSpec === undefined) {
    return state;
  }

  const record = (state.records.get(op.ref) ?? {}) as Record<string, unknown>;
  const from = transitionFromTransformer({ record, field: transitionSpec.field });
  const { to } = op.transition;
  const ingredientName = rowRefIngredientTransformer({ rowRef: op.ref });

  const walked: unknown = await (async (): Promise<unknown> => {
    try {
      return await transitionSpec.reach({ from, to, target, record });
    } catch (cause) {
      throw new HydrationTransitionRefusedError({
        recipeName: state.recipeName,
        ingredientName,
        from:
          typeof from === 'string'
            ? from
            : typeof from === 'number' || typeof from === 'boolean'
              ? String(from)
              : JSON.stringify(from),
        to: String(to),
        gateMessage: cause instanceof Error ? cause.message : String(cause),
      });
    }
  })();

  state.records.set(op.ref, walked);
  return state;
};
