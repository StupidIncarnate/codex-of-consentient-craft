/**
 * PURPOSE: Per-questId async mutex that serializes critical sections touching a quest file, permitting concurrent work across different quests
 *
 * USAGE:
 * await questWithModifyLockBroker({ questId, run: async (): Promise<MyResult> => { ... } });
 * // Chains run after any prior lock for the same questId; different questIds run concurrently
 *
 * WHEN-TO-USE: Any read-modify-write against quest.json that is NOT routed through `questModifyBroker`
 * (e.g., the smoketest scenario driver stamping `smoketestPromptOverride` on work items whose status
 * does not allow that field through the modify-quest allowlist).
 * WHEN-NOT-TO-USE: Inside `questModifyBroker` itself — it owns the lock internally via its colocated layer.
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
