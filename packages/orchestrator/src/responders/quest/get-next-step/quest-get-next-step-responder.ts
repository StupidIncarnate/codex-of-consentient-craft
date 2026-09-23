/**
 * PURPOSE: Responder for the MCP get-next-step tool — enforces dispatcher exclusivity (forced
 * idle with a reason while the Node dispatcher is playing) and the rate-limit guardrail (forced
 * idle while a hold stands), records the MCP heartbeat otherwise, then calls
 * questGetNextStepBroker with an inert active-quest facade and returns the NextStep decision.
 *
 * USAGE:
 * const step = await QuestGetNextStepResponder();
 * // Returns: NextStep — { type: 'idle', reason? } | { type: 'spawn-agents', agents } | { type: 'run-step', handler, args }
 *
 * The facade is inert because per-emission active-quest tagging is no longer used — the
 * broadcaster derives questId from each entry's workItem.questId mapping. The facade
 * argument is kept on the broker for backward compatibility with the smoketest in-process
 * driver and the existing tests; an inert no-op satisfies the contract here.
 */

import { dispatchStateHeartbeatBroker } from '../../../brokers/dispatch-state/heartbeat/dispatch-state-heartbeat-broker';
import { dispatchStateReadBroker } from '../../../brokers/dispatch-state/read/dispatch-state-read-broker';
import { questGetNextStepBroker } from '../../../brokers/quest/get-next-step/quest-get-next-step-broker';
import type { ActiveQuestFacade } from '../../../contracts/active-quest-facade/active-quest-facade-contract';
import { nextStepContract, type NextStep } from '../../../contracts/next-step/next-step-contract';
import { isDispatchHoldExpiredGuard } from '../../../guards/is-dispatch-hold-expired/is-dispatch-hold-expired-guard';
import { orchestrationDispatchStatics } from '../../../statics/orchestration-dispatch/orchestration-dispatch-statics';
import { dispatchHoldToIdleReasonTransformer } from '../../../transformers/dispatch-hold-to-idle-reason/dispatch-hold-to-idle-reason-transformer';

const INERT_ACTIVE_QUEST_FACADE: ActiveQuestFacade = {
  setActive: (): void => {
    // No-op — active-quest singleton is removed. Per-emission tagging is replaced by
    // routing via workItem.questId at the broadcaster.
  },
  clear: (): void => {
    // No-op — see setActive above.
  },
};

export const QuestGetNextStepResponder = async (): Promise<NextStep> => {
  const dispatchState = await dispatchStateReadBroker();

  if (dispatchState.mode === 'node-playing') {
    return nextStepContract.parse({
      type: 'idle',
      reason: orchestrationDispatchStatics.exclusivity.mcpIdleReason,
    });
  }

  // The guardrail binds BOTH dispatchers. It is checked here rather than left to the Node loop's
  // isPlaying() gate, because /dumpster-launch never reads that gate — it polls this tool, and
  // without this branch an MCP-mode queue would keep dispatching Task() agents straight into a
  // spent quota, which is the exact way a quest died before this existed.
  const hold = dispatchState.hold ?? null;
  if (hold !== null && !isDispatchHoldExpiredGuard({ hold, nowMs: Date.now() })) {
    return nextStepContract.parse({
      type: 'idle',
      reason: dispatchHoldToIdleReasonTransformer({ hold }),
    });
  }

  // Record that a /dumpster-launch loop is actively polling — the Node play gate refuses
  // while this heartbeat is fresh.
  await dispatchStateHeartbeatBroker();

  return questGetNextStepBroker({ activeQuest: INERT_ACTIVE_QUEST_FACADE });
};
