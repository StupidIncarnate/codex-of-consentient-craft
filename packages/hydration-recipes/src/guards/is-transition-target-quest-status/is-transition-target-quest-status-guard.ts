/**
 * PURPOSE: Answers whether a value is one of the quest statuses a caller may ASK a quest to
 * transition to — every `questStatusContract` member except the handful nothing reaches by asking
 * (`created`, `pending`, `paused`, `blocked`, `merging`, `merged` — see
 * `quest-ingredient-broker.ts`'s own header for why each one is excluded). `questStatusWalkPathTransformer`
 * calls this to keep a BFS walk from stepping INTO an unaskable status mid-path.
 * `quest-transition-target-statuses-statics.ts` pins a literal snapshot of what this guard
 * currently allows, for `quest-ingredient-broker.ts`'s own `transitions.to`: a `.filter()` through
 * this guard cannot carry literal types forward the way an inline tuple would, so the ingredient
 * reads that pinned list instead of calling this guard directly — this guard's own test asserts
 * the two stay in sync. The exclusion list stays an INLINE expression rather than a `const` array,
 * deliberately: a `const`-bound string array trips `@dungeonmaster/enforce-magic-arrays` wherever
 * it is not a `.stub.ts`/`.proxy.ts`/`.test.ts`/`statics/` file, and this guard's own file is none
 * of those.
 *
 * USAGE:
 * isTransitionTargetQuestStatusGuard({ status: 'explore_flows' });
 * // Returns true
 * isTransitionTargetQuestStatusGuard({ status: 'blocked' });
 * // Returns false
 */
import type { QuestStatus } from '@dungeonmaster/shared/contracts';

export const isTransitionTargetQuestStatusGuard = ({
  status,
}: {
  status?: QuestStatus;
}): boolean => {
  if (status === undefined) {
    return false;
  }
  return !['created', 'pending', 'paused', 'blocked', 'merging', 'merged'].includes(status);
};
