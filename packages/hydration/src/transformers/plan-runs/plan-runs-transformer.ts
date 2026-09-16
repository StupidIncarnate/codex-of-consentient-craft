/**
 * PURPOSE: Answers whether a plan can run with no server, as an ALL over the ingredients it
 * actually creates — never a union of the routes those ingredients happen to offer, which answers
 * the different and more optimistic question of which routes appear ANYWHERE in the plan. Reach
 * for this wherever the listing needs its `runs` line, before anything on the plan has executed.
 *
 * USAGE:
 * planRunsTransformer({ plan, ingredients: [guildConfig, questConfig] });
 * // Returns { serverless: true } or { serverless: false, needsServerFor: 'guild' }
 */
import { planRunsResultContract } from '../../contracts/plan-runs-result/plan-runs-result-contract';
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

  const needsServerFor = declaredInOrder.find(
    (ingredient) => configByName.get(ingredient)?.routes.write === undefined,
  );

  if (needsServerFor === undefined) {
    return planRunsResultContract.parse({ serverless: true });
  }

  return planRunsResultContract.parse({ serverless: false, needsServerFor });
};
