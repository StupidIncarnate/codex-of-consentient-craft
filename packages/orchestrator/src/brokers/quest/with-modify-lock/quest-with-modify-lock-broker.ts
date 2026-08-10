/**
 * PURPOSE: The one per-questId mutex every whole-file read-modify-write of quest.json queues behind.
 * A second mutex is not a second lock, it is a lost update: two writers that do not queue behind
 * THIS one both read the same bytes and both rename the same `quest.json.tmp`, so the later persist
 * erases the earlier writer's fields and can ENOENT on the rename outright.
 *
 * USAGE:
 * await questWithModifyLockBroker({ questId, run: async (): Promise<MyResult> => { ... } });
 * // Chains run after any prior lock for the same questId; different questIds run concurrently
 *
 * WHEN-TO-USE: Any read-modify-write against quest.json that neither `questModifyBroker` nor
 * `questOperationsUpdateBroker` can carry — a field outside the modify-quest allowlist (the
 * smoketest driver's `smoketestPromptOverride`), or a whole-subtree rewrite rather than an upsert
 * of a caller-supplied patch (`questResetFlowSignoffsBroker`).
 * WHEN-NOT-TO-USE: Around a call to `questModifyBroker` or `questOperationsUpdateBroker`. Both take
 * this lock themselves and it is deliberately non-reentrant, so wrapping one deadlocks that questId.
 */

import type { QuestId } from '@dungeonmaster/shared/contracts';

import { questModifyLocksLayerBroker } from './quest-modify-locks-layer-broker';

export const questWithModifyLockBroker = async <T>({
  questId,
  run,
}: {
  questId: QuestId;
  run: () => Promise<T>;
}): Promise<T> => {
  const prior = questModifyLocksLayerBroker.get(questId) ?? Promise.resolve();

  // Wait for the prior promise, swallowing its rejection so a poisoned chain entry
  // does not block subsequent waiters on the same questId.
  const waitForPrior = prior.then(
    () => undefined,
    () => undefined,
  );

  const runPromise = waitForPrior.then(async () => run());

  // Track completion (success or failure) so the next waiter proceeds once this call finishes.
  // Swallow at the chain level — callers still observe the real rejection via runPromise.
  const chainPromise = runPromise.then(
    () => undefined,
    () => undefined,
  );

  questModifyLocksLayerBroker.set(questId, chainPromise);

  // Clean up map entry once this chain settles, if no newer waiter has replaced it.
  chainPromise.then(
    () => {
      if (questModifyLocksLayerBroker.get(questId) === chainPromise) {
        questModifyLocksLayerBroker.delete(questId);
      }
    },
    () => undefined,
  );

  return runPromise;
};
