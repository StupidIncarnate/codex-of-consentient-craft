/**
 * PURPOSE: Defines the structure for tracking a running orchestration process. The optional `questWorkItemId` distinguishes per-agent launcher entries (set) from quest-level loop dispatchers (omitted) so a future per-agent message-injection endpoint can address an individual running agent via `findByQuestWorkItemId` without disturbing existing `findByQuestId` lookups that target the loop-level kill handle.
 *
 * USAGE:
 * orchestrationProcessContract.parse({processId, questId, kill: () => {}});
 * // Loop-level entry (no questWorkItemId)
 *
 * orchestrationProcessContract.parse({processId, questId, questWorkItemId, kill: () => {}});
 * // Per-agent entry registered by agentLaunchBroker
 */

import { z } from '#gateway/npm/zod';

import {
  processIdContract,
  questIdContract,
  questWorkItemIdContract,
} from '@dungeonmaster/shared/contracts';

// `kill` is a function — a Zod object schema cannot check callability, so it stays out of the
// parse and is attached only through the type intersection below. `.loose()` carries it
// through `.parse()` unvalidated when a real caller supplies one.
export const orchestrationProcessContract = z
  .object({
    processId: processIdContract,
    questId: questIdContract,
    questWorkItemId: questWorkItemIdContract.optional(),
  })
  .loose();

export type OrchestrationProcess = z.infer<typeof orchestrationProcessContract> & {
  kill: () => void;
};
