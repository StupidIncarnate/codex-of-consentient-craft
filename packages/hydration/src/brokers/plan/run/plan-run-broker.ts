/**
 * PURPOSE: Walks a plan's op tree depth-first in declaration order, serially, against one target,
 * and hands back the records `saveRecordAs` named. Reach for this as the only thing that touches the
 * target at all — the chain builds and does not execute, and every I/O in this package is either an
 * ingredient's own route or something this broker called.
 *
 * The walk is a `.reduce()` async chain, each step awaiting the one before it, never `Promise.all` —
 * a deliberate departure from this repo's usual "Promise.all whenever the calls do not depend on
 * each other" default. `guildHarness` already has the measured case this avoids: concurrent DELETEs
 * corrupt config.json through a race on its own read-modify-write, and the same race hits two
 * concurrent file-backed CREATEs sharing one config file — the runner is serial, and that is a
 * requirement, not an implementation detail. A `.reduce()` chain, not a `for…of` with `await`
 * inside: this repo's own `no-await-in-loop` lint rule (error, repo-wide) forbids the loop-statement
 * form of the same order-dependent sequencing — `package-scaffold-write-broker.ts` and
 * `run-execute-broker.ts` hit the identical rule for the identical reason and settle on the same
 * shape.
 *
 * USAGE:
 * const result = await planRunBroker({ plan, target: { home }, ingredients });
 * // Returns { guild: {...}, third: {...} } — one key per saveRecordAs, nothing else
 */
import { planPreflightBroker } from '../preflight/plan-preflight-broker';
import { planFoldWritesTransformer } from '../../../transformers/plan-fold-writes/plan-fold-writes-transformer';
import { rowRefIngredientTransformer } from '../../../transformers/row-ref-ingredient/row-ref-ingredient-transformer';
import { opCreateApplyLayerBroker } from './op-create-apply-layer-broker';
import { opSaveRecordApplyLayerBroker } from './op-save-record-apply-layer-broker';
import { opRemoveApplyLayerBroker } from './op-remove-apply-layer-broker';
import { opExtraApplyLayerBroker } from './op-extra-apply-layer-broker';
import { opSetApplyLayerBroker } from './op-set-apply-layer-broker';
import { opUpdateApplyLayerBroker } from './op-update-apply-layer-broker';
import { opFilterApplyLayerBroker } from './op-filter-apply-layer-broker';
import { hydrationRunResultContract } from '../../../contracts/hydration-run-result/hydration-run-result-contract';
import type { HydrationRunResult } from '../../../contracts/hydration-run-result/hydration-run-result-contract';
import type { HydrationPlan } from '../../../contracts/hydration-plan/hydration-plan-contract';
import type { HydrationTarget } from '../../../contracts/hydration-target/hydration-target-contract';
import type { IngredientConfigData } from '../../../contracts/ingredient-config/ingredient-config-contract';
import type { IngredientName } from '../../../contracts/ingredient-name/ingredient-name-contract';
import type { HydrationRunState } from '../../../contracts/hydration-run-state/hydration-run-state-contract';

export const planRunBroker = async ({
  plan,
  target,
  ingredients,
}: {
  plan: HydrationPlan;
  target: HydrationTarget;
  ingredients: readonly IngredientConfigData[];
}): Promise<HydrationRunResult> => {
  const routePlan = planPreflightBroker({ plan, target, ingredients });
  const foldedPlan = planFoldWritesTransformer({ plan });

  const configByName = new Map<IngredientName, IngredientConfigData>(
    ingredients.map((config) => [config.name, config] as const),
  );

  const state: HydrationRunState = {
    recipeName: plan.recipeName,
    records: new Map(),
    saved: new Map(),
  };

  await foldedPlan.ops.reduce(async (previous, op) => {
    await previous;

    if (op.op === 'create') {
      // `configByName.get` and `routePlan[...]` stay optional-checked rather than asserted: D1
      // makes this total by construction (Q1), but `no-non-null-assertion` is a hard ban, so the
      // impossible "not found" case degrades to skipping the op instead of asserting past the type.
      const config = configByName.get(op.ingredient);
      const route = routePlan[op.ingredient];
      if (config !== undefined && route !== undefined) {
        await opCreateApplyLayerBroker({ op, target, config, route, state });
      }
      return;
    }
    if (op.op === 'saveRecord') {
      opSaveRecordApplyLayerBroker({ op, state });
      return;
    }
    if (op.op === 'remove') {
      const ingredientName = rowRefIngredientTransformer({ rowRef: op.ref });
      const config = configByName.get(ingredientName);
      if (config !== undefined) {
        await opRemoveApplyLayerBroker({ op, target, config, state });
      }
      return;
    }
    if (op.op === 'extra') {
      const ingredientName = rowRefIngredientTransformer({ rowRef: op.ref });
      const config = configByName.get(ingredientName);
      if (config !== undefined) {
        await opExtraApplyLayerBroker({ op, target, config, state });
      }
      return;
    }
    if (op.op === 'set') {
      const ingredientName = rowRefIngredientTransformer({ rowRef: op.ref });
      const config = configByName.get(ingredientName);
      if (config !== undefined) {
        // Q2's ruling: a non-empty `written` reaching the walk is one the fold could not merge
        // into a `create` — an update, never a plain write — so it goes through the update layer
        // first. That layer itself calls `opSetApplyLayerBroker` for any `transition` the same op
        // also carries, once the written half has landed.
        if (Object.keys(op.written).length > 0) {
          await opUpdateApplyLayerBroker({ op, target, config, state });
        } else if (op.transition !== undefined) {
          await opSetApplyLayerBroker({ op, target, config, state });
        }
      }
      return;
    }
    // Every other op kind returns above, so only `filter` reaches here — TypeScript proves it by
    // eliminating the other five members of `HydrationOp`, which is what makes a plan calling a
    // SEVENTH op kind (one this file has not been taught) a compile error at this call site
    // rather than a runtime throw.
    const config = configByName.get(op.ingredient);
    if (config !== undefined) {
      await opFilterApplyLayerBroker({ op, target, config, state });
    }
  }, Promise.resolve());

  return hydrationRunResultContract.parse(Object.fromEntries(state.saved));
};
