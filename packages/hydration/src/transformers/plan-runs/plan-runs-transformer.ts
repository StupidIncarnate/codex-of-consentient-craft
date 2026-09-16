/**
 * PURPOSE: Answers whether a plan can run with no server, as an ALL over the ingredients it
 * actually creates — never a union of the routes those ingredients happen to offer, which answers
 * the different and more optimistic question of which routes appear ANYWHERE in the plan. Reach
 * for this wherever the listing needs its `runs` line, before anything on the plan has executed.
 *
 * Re-expressed on `routeSelectTransformer` (Q10) so the listing's route rule and the runner's own
 * selection are ONE implementation — asked here with `hasBaseUrl: false`, since this is always the
 * "no server" question regardless of what a real caller's target later turns out to hold. That
 * reuse stops short of `routeSelectTransformer`'s full verdict on purpose: with no base URL its
 * selection is `'write'`, `'recording'` or `null`, and only `'write'` counts as serverless here —
 * a `recording`-only ingredient still reports `needs a server`, per the Known-gaps row this
 * transformer's own history records. Comparing against `!== null` instead would silently WIDEN
 * what "runs serverless" means, exactly what re-expressing this rule must not do.
 *
 * USAGE:
 * planRunsTransformer({ plan, ingredients: [guildConfig, questConfig] });
 * // Returns { serverless: true } or { serverless: false, needsServerFor: 'guild' }
 */
import { planRunsResultContract } from '../../contracts/plan-runs-result/plan-runs-result-contract';
import { routeSelectTransformer } from '../route-select/route-select-transformer';
import type { PlanRunsResult } from '../../contracts/plan-runs-result/plan-runs-result-contract';
import type { HydrationPlan } from '../../contracts/hydration-plan/hydration-plan-contract';
import type { HydrationOp } from '../../contracts/hydration-op/hydration-op-contract';
import type { IngredientConfigData } from '../../contracts/ingredient-config/ingredient-config-contract';
import type { IngredientName } from '../../contracts/ingredient-name/ingredient-name-contract';

export const planRunsTransformer = ({
  plan,
  ingredients,
}: {
  plan: HydrationPlan;
  ingredients: readonly IngredientConfigData[];
}): PlanRunsResult => {
  const configByName = new Map<IngredientName, IngredientConfigData>(
    ingredients.map((config) => [config.name, config] as const),
  );

  // Depth-first, declaration order: a LIFO stack seeded in reverse so `.pop()` yields the plan's
  // own left-to-right order, and a `filter`'s nested ops are pushed (also reversed) the moment it
  // is popped, so they are visited before the rest of the stack rather than after it.
  const stack: HydrationOp[] = [...plan.ops].reverse();
  const seen = new Set<IngredientName>();
  const declaredInOrder: IngredientName[] = [];

  while (stack.length > 0) {
    const op = stack.pop();
    if (op !== undefined) {
      if (op.op === 'create' && !seen.has(op.ingredient)) {
        seen.add(op.ingredient);
        declaredInOrder.push(op.ingredient);
      }
      if (op.op === 'filter') {
        stack.push(...[...op.ops].reverse());
      }
    }
  }

  const needsServerFor = declaredInOrder.find((ingredient) => {
    const config = configByName.get(ingredient);
    if (config === undefined) {
      return true;
    }
    return routeSelectTransformer({ routes: config.routes, hasBaseUrl: false }) !== 'write';
  });

  if (needsServerFor === undefined) {
    return planRunsResultContract.parse({ serverless: true });
  }

  return planRunsResultContract.parse({ serverless: false, needsServerFor });
};
