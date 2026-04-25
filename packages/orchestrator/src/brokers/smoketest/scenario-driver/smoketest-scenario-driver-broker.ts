/**
 * PURPOSE: Drives a smoketest scenario by stamping canned prompt overrides on pending work items as the quest mutates
 *
 * USAGE:
 * const driver = await smoketestScenarioDriverBroker({
 *   questId,
 *   dispense: ({ role }) => smoketestScenarioState.dispense({ questId, role }),
 *   subscribe: (handler) => orchestrationEventsState.on({ type: 'quest-modified', handler }),
 *   unsubscribe: (handler) => orchestrationEventsState.off({ type: 'quest-modified', handler }),
 * });
 * // Subscribes via the injected callbacks FIRST, then awaits the initial sweep for work items that
 * // already exist (e.g. the hydrated chain persisted before the driver subscribed). The returned
 * // promise resolves AFTER every initial override has been stamped, so the caller can safely start
 * // the orchestration loop without racing the first dispatch. Call driver.stop() to unsubscribe.
 *
 * WHEN-TO-USE: For orchestration smoketest cases that exercise retry paths where dynamically-inserted work items
 * (replans, spiritmender, fix chains) cannot be pre-stamped by the hydrator.
 * WHEN-NOT-TO-USE: Outside smoketests. Production orchestration must never stamp prompt overrides.
 *
 * WHY subscribe/unsubscribe/dispense are injected: brokers/ cannot import state/ per folder rules. The caller
 * (a responder that CAN import state/) wires the real event bus and the scenario-state dispense callback.
 *
 * WHY the subscribe runs BEFORE the awaited sweep: quest-modified events that fire during the sweep itself
 * (e.g. caused by the sweep's own stamp writes) must be captured by a live handler. Subscribing first then
 * awaiting the sweep keeps that window closed.
 *
 * WHY the sweep is awaited: questHydrateBroker persists the initial work-item chain BEFORE the driver subscribes,
 * so those hydrated items need stamping before the orchestration loop dispatches them. A fire-and-forget sweep
 * races the loop's first spawn; awaiting it blocks the caller until every initial override is in place.
 */

import type { ProcessId, QuestId, WorkItemRole } from '@dungeonmaster/shared/contracts';

import { GuildNotFoundError } from '../../../errors/guild-not-found/guild-not-found-error';
import { QuestNotFoundError } from '../../../errors/quest-not-found/quest-not-found-error';
import type { SmoketestPromptName } from '../../../statics/smoketest-prompts/smoketest-prompts-statics';
import { createDriverHandlerLayerBroker } from './create-driver-handler-layer-broker';
import { createDriverPollTickLayerBroker } from './create-driver-poll-tick-layer-broker';
import { smoketestSweepPendingWorkItemsLayerBroker } from './smoketest-sweep-pending-work-items-layer-broker';

type QuestModifiedHandler = (event: {
  processId: ProcessId;
  payload: { questId?: unknown };
}) => void;

type Dispense = ({ role }: { role: WorkItemRole }) => SmoketestPromptName | null;

// Default polling interval for the fallback re-sweep. `quest-modified` is emitted through the file
// outbox (cross-process) and never on the in-memory event bus, so retry-inserted work items need a
// separate trigger to get stamped before the orchestration loop dispatches them. 250ms is short
// enough that a freshly-inserted work item is stamped well before the orchestration loop's next
// iteration in practice (each iteration involves a quest-file read + agent spawn).
const DEFAULT_POLL_INTERVAL_MS = 250;

export const smoketestScenarioDriverBroker = async ({
  questId,
  dispense,
  subscribe,
  unsubscribe,
  onQuestGone,
  pollIntervalMs,
}: {
  questId: QuestId;
  dispense: Dispense;
  subscribe: (handler: QuestModifiedHandler) => void;
  unsubscribe: (handler: QuestModifiedHandler) => void;
  onQuestGone?: (params: { questId: QuestId }) => void;
  pollIntervalMs?: number;
}): Promise<{ stop: () => void }> => {
  const abortController = new AbortController();
  const intervalMs = pollIntervalMs ?? DEFAULT_POLL_INTERVAL_MS;

  const handler = createDriverHandlerLayerBroker({
    questId,
    abortSignal: abortController.signal,
    dispense,
  });

  // Subscribe FIRST so any quest-modified events that fire during the initial sweep (including those
  // caused by the sweep's own stamp writes) are captured by a live handler.
  subscribe(handler);

  // Initial sweep: stamp any work items that already exist on the quest at driver-construction time.
  // Awaiting this guarantees every hydrated work item is stamped BEFORE the caller starts the
  // orchestration loop; otherwise the loop can dispatch an unstamped item with the real role template.
  // On failure, unwind the subscription and re-throw so the runner's outer try/catch produces a
  // failed case result instead of silently leaving a dangling handler + an unstamped quest. When the
  // failure is "quest not found in any guild" (quest deleted/abandoned before the driver subscribed),
  // fire onQuestGone so the caller can release its scenario-state entry; still re-throw so the outer
  // runner can mark the case failed.
  await smoketestSweepPendingWorkItemsLayerBroker({
    questId,
    abortSignal: abortController.signal,
    dispense,
  }).catch((error: unknown) => {
    abortController.abort();
    unsubscribe(handler);
    if (
      (error instanceof QuestNotFoundError || error instanceof GuildNotFoundError) &&
      onQuestGone !== undefined
    ) {
      onQuestGone({ questId });
    }
    throw error;
  });

  // Periodic re-sweep — quest-modified events go through the file outbox (cross-process), not the
  // in-memory event bus, so subscribing alone will never catch retry-inserted work items in this
  // process. The poll guarantees dynamically-added work items (codeweaver-fail replan pathseeker,
  // lawbringer-fail spiritmender, blightwarden failed-replan pathseeker) get stamped before the
  // orchestration loop dispatches them with a real role template.
  //
  // The tick body (sweep + self-destruct on quest-gone) lives in createDriverPollTickLayerBroker
  // so no nested function is declared inside this broker. The layer takes a stopNow callback that
  // the driver wires to its own teardown — on quest-gone detection, the layer invokes stopNow
  // (clearInterval + abort + unsubscribe) then onQuestGone so the scenario-state entry is released.
  const interval: ReturnType<typeof setInterval> = setInterval(
    createDriverPollTickLayerBroker({
      questId,
      abortSignal: abortController.signal,
      dispense,
      stopNow: (): void => {
        clearInterval(interval);
        abortController.abort();
        unsubscribe(handler);
      },
      ...(onQuestGone === undefined ? {} : { onQuestGone }),
    }),
    intervalMs,
  );

  return {
    stop: (): void => {
      clearInterval(interval);
      abortController.abort();
      unsubscribe(handler);
    },
  };
};
