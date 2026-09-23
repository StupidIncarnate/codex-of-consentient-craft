/**
 * PURPOSE: `planPreflightBroker`'s own VERB check (its numbered section 4), pulled out to one node
 * at a time so the parent's own cyclomatic complexity stays under the repo's enforced ceiling.
 * Reach for this only from `planPreflightBroker` — it is a decomposition of that one function, not
 * a general utility, and its ONLY job is Q2's ruling: a chain call needs `query`, `update` or
 * `remove` and the ingredient declares no matching route.
 *
 * USAGE:
 * const nested = verbCheckLayerBroker({ op, plan, configByName });
 * // Returns a filter's own nested ops to keep walking, or [] for every other op kind — and THROWS
 * // HydrationRouteVerbUnavailableError when the op's own ingredient lacks the route it needs
 */
import { rowRefIngredientTransformer } from '../../../transformers/row-ref-ingredient/row-ref-ingredient-transformer';
import { HydrationRouteVerbUnavailableError } from '../../../errors/hydration-route-verb-unavailable/hydration-route-verb-unavailable-error';
import type { HydrationPlan } from '../../../contracts/hydration-plan/hydration-plan-contract';
import type { HydrationOp } from '../../../contracts/hydration-op/hydration-op-contract';
import type { IngredientConfigData } from '../../../contracts/ingredient-config/ingredient-config-contract';
import type { IngredientName } from '../../../contracts/ingredient-name/ingredient-name-contract';

export const verbCheckLayerBroker = ({
  op,
  plan,
  configByName,
}: {
  op: HydrationOp;
  plan: HydrationPlan;
  configByName: Map<IngredientName, IngredientConfigData>;
}): readonly HydrationOp[] => {
  if (op.op === 'filter' || op.op === 'attach') {
    const query = configByName.get(op.ingredient)?.routes.query;
    if (query === undefined) {
      throw new HydrationRouteVerbUnavailableError({
        recipeName: plan.recipeName,
        ingredientName: op.ingredient,
        verb: 'query',
      });
    }
    return op.op === 'filter' ? op.ops : [];
  }
  if (op.op === 'remove') {
    const ingredientName = rowRefIngredientTransformer({ rowRef: op.ref });
    const remove = configByName.get(ingredientName)?.routes.remove;
    if (remove === undefined) {
      throw new HydrationRouteVerbUnavailableError({
        recipeName: plan.recipeName,
        ingredientName,
        verb: 'remove',
      });
    }
    return [];
  }
  if (op.op === 'set' && Object.keys(op.written).length > 0) {
    const ingredientName = rowRefIngredientTransformer({ rowRef: op.ref });
    const update = configByName.get(ingredientName)?.routes.update;
    if (update === undefined) {
      throw new HydrationRouteVerbUnavailableError({
        recipeName: plan.recipeName,
        ingredientName,
        verb: 'update',
      });
    }
    return [];
  }
  return [];
};
