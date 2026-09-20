/**
 * PURPOSE: Folds each `set`'s written half into the `create` op that mints the same row, so one row
 * costs one route call. Reach for this between the pre-flight and the walk, never earlier — the
 * pre-flight measures declaration order over the DECLARED plan, and folding changes op positions,
 * so running it first would change what "declared LATER" means for a `fromSaved` refusal.
 *
 * A `set` folds only when no `remove` op targeting that same `ref` precedes it in the plan, and
 * every `SavedRef` among its written values names a record already saved BEFORE the matching
 * `create` op — not merely before the `set` itself, because folding is what moves that write earlier,
 * onto the create. A `set` that fails this condition, or whose `ref` matches no top-level `create` at
 * all (a filter's nested `set` always targets `matchedRef`, a run-time placeholder no `create` op
 * ever produces), is left as its own op — the walk applies it as an update instead of folding it away.
 * A `set` carrying a `transition` keeps that half as a standalone op even when its `written` half
 * folds clean, since a transition is walked through the ingredient's own gates at run time and cannot
 * be merged into a `create`'s fields.
 *
 * USAGE:
 * planFoldWritesTransformer({
 *   plan: HydrationPlanStub({
 *     ops: [OpCreateStub({ ref: 'guild[0:0]/quest[0:0]' }), OpSetStub({ ref: 'guild[0:0]/quest[0:0]' })],
 *   }),
 * });
 * // Returns a HydrationPlan whose create carries the set's written fields and no set op
 */
import { hydrationPlanContract } from '../../contracts/hydration-plan/hydration-plan-contract';
import type { HydrationPlan } from '../../contracts/hydration-plan/hydration-plan-contract';
import { opCreateContract } from '../../contracts/op-create/op-create-contract';
import { opSetContract } from '../../contracts/op-set/op-set-contract';
import type { OpSet } from '../../contracts/op-set/op-set-contract';
import type { HydrationOp } from '../../contracts/hydration-op/hydration-op-contract';
import type { RowRef } from '../../contracts/row-ref/row-ref-contract';
import type { SavedRecordName } from '../../contracts/saved-record-name/saved-record-name-contract';
import type { FieldValues } from '../../contracts/field-values/field-values-contract';
import { isSavedRefGuard } from '../../guards/is-saved-ref/is-saved-ref-guard';
import { savedRefContract } from '../../contracts/saved-ref/saved-ref-contract';

export const planFoldWritesTransformer = ({ plan }: { plan: HydrationPlan }): HydrationPlan => {
  // Depth-first, declaration order, matching plan-runs/plan-makes/plan-saved-names: a LIFO stack
  // seeded in reverse so `.pop()` yields the plan's own left-to-right order, walking into a
  // `filter`'s nested ops the moment it is popped. `savedBeforeRef` snapshots, for each `create`
  // this walk crosses, every name a `saveRecord` had already produced by that point — the
  // membership test a fold needs, with no numeric position to compare.
  const walkStack: HydrationOp[] = [...plan.ops].reverse();
  const savedSoFar = new Set<SavedRecordName>();
  const savedBeforeRef = new Map<RowRef, ReadonlySet<SavedRecordName>>();

  while (walkStack.length > 0) {
    const op = walkStack.pop();
    if (op !== undefined) {
      if (op.op === 'create') {
        savedBeforeRef.set(op.ref, new Set(savedSoFar));
      }
      if (op.op === 'saveRecord') {
        savedSoFar.add(op.name);
      }
      if (op.op === 'filter') {
        walkStack.push(...[...op.ops].reverse());
      }
    }
  }

  // Only a top-level `set` is ever a fold candidate — see this file's own PURPOSE for why a
  // filter's nested `set` never matches a `create.ref` here.
  const foldedFieldsByRef = new Map<RowRef, FieldValues>();
  const droppedSets = new Set<HydrationOp>();
  const transitionOnlySets = new Map<HydrationOp, OpSet>();
  const removedRefs = new Set<RowRef>();

  for (const op of plan.ops) {
    if (op.op === 'remove') {
      removedRefs.add(op.ref);
    }
    if (op.op === 'filter') {
      const filterStack: HydrationOp[] = [...op.ops].reverse();
      while (filterStack.length > 0) {
        const nested = filterStack.pop();
        if (nested !== undefined) {
          if (nested.op === 'remove') {
            removedRefs.add(nested.ref);
          }
          if (nested.op === 'filter') {
            filterStack.push(...[...nested.ops].reverse());
          }
        }
      }
    }
    if (op.op !== 'set') {
      continue;
    }
    if (removedRefs.has(op.ref)) {
      continue;
    }
    const availableNames = savedBeforeRef.get(op.ref);
    if (availableNames === undefined) {
      continue;
    }
    const everySavedRefIsAvailable = Object.values(op.written).every((value) => {
      if (!isSavedRefGuard({ value })) {
        return true;
      }
      return availableNames.has(savedRefContract.parse(value).name);
    });
    if (!everySavedRefIsAvailable) {
      continue;
    }

    const alreadyFolded = foldedFieldsByRef.get(op.ref) ?? {};
    foldedFieldsByRef.set(op.ref, { ...alreadyFolded, ...op.written });

    if (op.transition === undefined) {
      droppedSets.add(op);
    } else {
      transitionOnlySets.set(
        op,
        opSetContract.parse({ op: 'set', ref: op.ref, written: {}, transition: op.transition }),
      );
    }
  }

  const foldedOps: HydrationOp[] = [];
  for (const op of plan.ops) {
    if (op.op === 'set' && droppedSets.has(op)) {
      continue;
    }
    const transitionOnly = op.op === 'set' ? transitionOnlySets.get(op) : undefined;
    if (transitionOnly !== undefined) {
      foldedOps.push(transitionOnly);
      continue;
    }
    if (op.op === 'create' && foldedFieldsByRef.has(op.ref)) {
      foldedOps.push(
        opCreateContract.parse({
          ...op,
          fields: { ...op.fields, ...foldedFieldsByRef.get(op.ref) },
        }),
      );
      continue;
    }
    foldedOps.push(op);
  }

  return hydrationPlanContract.parse({ recipeName: plan.recipeName, ops: foldedOps });
};
