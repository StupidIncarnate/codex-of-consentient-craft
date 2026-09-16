/**
 * PURPOSE: Counts what a plan makes, per ingredient, off the plan's own `create` ops. An
 * ingredient the plan only reaches through a `filter` — including one a transition minted, which
 * a plan can only see once a `filter` reaches into it — has no honest count before the plan runs,
 * so it reports `varies` rather than a number carried over from an earlier `create`. Reach for
 * this over a hand-written recipe summary: the listing prints the plan, so there is nothing for a
 * sentence to drift from.
 *
 * USAGE:
 * planMakesTransformer({ plan });
 * // Returns [{ ingredient: 'guild', count: 1 }, { ingredient: 'quest', count: 3 }]
 */
import { planMakesEntryContract } from '../../contracts/plan-makes-entry/plan-makes-entry-contract';
import type { PlanMakesEntry } from '../../contracts/plan-makes-entry/plan-makes-entry-contract';
import type { HydrationPlan } from '../../contracts/hydration-plan/hydration-plan-contract';
import type { HydrationOp } from '../../contracts/hydration-op/hydration-op-contract';
import type { IngredientName } from '../../contracts/ingredient-name/ingredient-name-contract';

export const planMakesTransformer = ({
  plan,
}: {
  plan: HydrationPlan;
}): readonly PlanMakesEntry[] => {
  // Depth-first, declaration order — see plan-runs-transformer for why the stack is seeded and
  // re-pushed in reverse.
  const stack: HydrationOp[] = [...plan.ops].reverse();
  const counts = new Map<IngredientName, number | 'varies'>();
  const declaredInOrder: IngredientName[] = [];

  while (stack.length > 0) {
    const op = stack.pop();
    if (op !== undefined) {
      if (op.op === 'create') {
        const current = counts.get(op.ingredient);
        if (current !== 'varies') {
          if (!counts.has(op.ingredient)) {
            declaredInOrder.push(op.ingredient);
          }
          counts.set(op.ingredient, (current ?? 0) + 1);
        }
      }
      if (op.op === 'filter') {
        if (!counts.has(op.ingredient)) {
          declaredInOrder.push(op.ingredient);
        }
        counts.set(op.ingredient, 'varies');
        stack.push(...[...op.ops].reverse());
      }
    }
  }

  return declaredInOrder.map((ingredient) =>
    planMakesEntryContract.parse({ ingredient, count: counts.get(ingredient) }),
  );
};
