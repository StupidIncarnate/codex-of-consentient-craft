/**
 * PURPOSE: Per-questId async mutex that serializes modify-quest critical sections per quest while allowing concurrency across different quests
 *
 * USAGE:
 * await withQuestModifyLockLayerBroker({ questId, run: async () => { /* critical section *\/ return value; } });
 * // Chains run after any prior lock for the same questId; different questIds run concurrently
 *
 * WHY-LAYER: Module-level Map<QuestId, Promise<void>> must live as private state of the modify broker.
 * Architecture layering forbids brokers from importing state/, but intra-folder layer files are allowed.
 */

import type { QuestId } from '@dungeonmaster/shared/contracts';

import { questModifyLocksLayerBroker } from './quest-modify-locks-layer-broker';

export const withQuestModifyLockLayerBroker = async <T>({
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
