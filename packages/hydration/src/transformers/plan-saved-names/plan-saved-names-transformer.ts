/**
 * PURPOSE: Every name this plan saves, in declaration order, so the pre-flight can tell a name that
 * is never saved from one saved too late. Reach for this over a `Set`: the order is what makes the
 * two `fromSaved` refusal cases distinguishable, and losing it collapses them into one message.
 *
 * USAGE:
 * planSavedNamesTransformer({ plan: HydrationPlanStub({ ops: [OpSaveRecordStub({ name: 'guild' })] }) });
 * // Returns ['guild']
 */
import type { HydrationPlan } from '../../contracts/hydration-plan/hydration-plan-contract';
import type { HydrationOp } from '../../contracts/hydration-op/hydration-op-contract';
import type { SavedRecordName } from '../../contracts/saved-record-name/saved-record-name-contract';

export const planSavedNamesTransformer = ({
  plan,
}: {
  plan: HydrationPlan;
}): readonly SavedRecordName[] => {
  // Depth-first, declaration order: a LIFO stack seeded in reverse so `.pop()` yields the plan's
  // own left-to-right order, walking into a `filter`'s nested ops the moment it is popped — a
  // `saveRecordAs` nested inside a filter is still part of the tree this walk has to cross.
  const stack: HydrationOp[] = [...plan.ops].reverse();
  const names: SavedRecordName[] = [];

  while (stack.length > 0) {
    const op = stack.pop();
    if (op !== undefined) {
      if (op.op === 'saveRecord') {
        names.push(op.name);
      }
      if (op.op === 'filter') {
        stack.push(...[...op.ops].reverse());
      }
    }
  }

  return names;
};
