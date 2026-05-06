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

import { z } from 'zod';

import {
  processIdContract,
  questIdContract,
  questWorkItemIdContract,
} from '@dungeonmaster/shared/contracts';

export const orchestrationProcessContract = z.object({
  processId: processIdContract,
  questId: questIdContract,
  questWorkItemId: questWorkItemIdContract.optional(),
  kill: z.function().args().returns(z.void()),
});

export type OrchestrationProcess = z.infer<typeof orchestrationProcessContract>;
