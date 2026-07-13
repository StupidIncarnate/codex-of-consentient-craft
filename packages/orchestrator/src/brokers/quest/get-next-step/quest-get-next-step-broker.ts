/**
 * PURPOSE: Multi-quest scan that returns the next dispatch instruction for /dumpster-launch. Picks the oldest post-Start-Quest quest (FIFO by createdAt) that still has incomplete work, sets it as the active quest, computes ready work items, and returns either a spawn-agents response for the next ready work item (the relay runs one session at a time, so this is always a single agent), a run-ward response, or idle. Long-polls internally up to ~25s before giving up.
 *
 * USAGE:
 * const step = await questGetNextStepBroker({ activeQuest });
 * // Returns: NextStep — { type: 'idle' } | { type: 'spawn-agents', agents } | { type: 'run-ward', ... }
 *
 * WHY activeQuest is a parameter: brokers cannot import from state/, so the caller
 * (MCP responder, registered in step 9) supplies the real `activeQuestState` facade.
 * Tests inject a stub.
 *
 * WHEN-TO-USE: From the get-next-step MCP tool. The /dumpster-launch LLM polls this in its
 *   dispatch loop.
 * WHEN-NOT-TO-USE: Anywhere else — this is the single dispatch decision surface for the new
 *   MCP-driven orchestration model.
 */

import { timerSetTimeoutAdapter } from '../../../adapters/timer/set-timeout/timer-set-timeout-adapter';
import type { ActiveQuestFacade } from '../../../contracts/active-quest-facade/active-quest-facade-contract';
import { nextStepContract, type NextStep } from '../../../contracts/next-step/next-step-contract';
import { scanOnceLayerBroker } from './scan-once-layer-broker';

const LONG_POLL_TOTAL_MS = 25_000;
const LONG_POLL_INTERVAL_MS = 500;

export const questGetNextStepBroker = async ({
  activeQuest,
  longPollTotalMs,
  longPollIntervalMs,
  deadline,
}: {
  activeQuest: ActiveQuestFacade;
  longPollTotalMs?: number;
  longPollIntervalMs?: number;
  deadline?: number;
}): Promise<NextStep> => {
  const totalMs = longPollTotalMs ?? LONG_POLL_TOTAL_MS;
  const intervalMs = longPollIntervalMs ?? LONG_POLL_INTERVAL_MS;
  const effectiveDeadline = deadline ?? Date.now() + totalMs;

  const step = await scanOnceLayerBroker({ activeQuest });
  if (step !== null) {
    return step;
  }
  if (Date.now() >= effectiveDeadline) {
    return nextStepContract.parse({ type: 'idle' });
  }
  await timerSetTimeoutAdapter({ ms: intervalMs });
  return questGetNextStepBroker({
    activeQuest,
    ...(longPollTotalMs === undefined ? {} : { longPollTotalMs }),
    longPollIntervalMs: intervalMs,
    deadline: effectiveDeadline,
  });
};
