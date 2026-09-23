/**
 * PURPOSE: The Node-run orchestration loop — drives the SAME get-next-step state machine that
 * /dumpster-launch polls, but dispatches by spawning headless Claude CLI children instead of
 * Task() sub-agents. One recursion per dispatch decision: spawn-agents → spawn the batch and
 * await exits; run-step → run that deterministic step synchronously; idle → return control to the
 * runner (which re-kicks on wake events — no sleep-polling). isPlaying() is read TWICE per
 * iteration — before the scan and again after it, because the scan long-polls and can return work
 * that only appeared after a pause. That pair is the graceful pause point: in-flight children
 * finish, nothing new dispatches.
 *
 * `run-ward` and `run-riftcarver` are still members of `NextStep` (removed in a later unit), but
 * nothing produces them any more — every family carrying a `ward`/`riftcarver` role runs it as a
 * deterministic step instead, which the `run-step` branch above already handles. The final branch
 * narrows to `spawn-agents` explicitly and THROWS for anything else, rather than reading `.agents`
 * off a variant that may not carry it.
 *
 * USAGE:
 * await questNodeDispatchLoopBroker({ isPlaying: () => orchestrationDispatchState.getIsPlaying() });
 * // Resolves when paused or when the state machine reports idle
 *
 * WHY isPlaying is a parameter: brokers cannot import state/ — the bootstrap responder supplies
 * the real orchestrationDispatchState facade; tests inject a stub. `onStepLine` is a parameter for
 * the same reason, and it is REQUIRED: a deterministic-step work item carries no sessionId, so the
 * JSONL watcher can never tail it, and this callback is the only route its output has to a UI.
 * Dropping it means minutes of a dead panel with nothing at the call site to show for it.
 */

import type {
  AdapterResult,
  ProcessId,
  QuestId,
  QuestWorkItemId,
} from '@dungeonmaster/shared/contracts';
import { adapterResultContract } from '@dungeonmaster/shared/contracts';

import type { ActiveQuestFacade } from '../../../contracts/active-quest-facade/active-quest-facade-contract';
import { orchestrationDispatchStatics } from '../../../statics/orchestration-dispatch/orchestration-dispatch-statics';
import { questGetNextStepBroker } from '../get-next-step/quest-get-next-step-broker';
import { questRunStepBroker } from '../run-step/quest-run-step-broker';
import { spawnBatchLayerBroker } from './spawn-batch-layer-broker';

const INERT_ACTIVE_QUEST_FACADE: ActiveQuestFacade = {
  setActive: (_: { questId: string | null }): void => undefined,
  clear: (): void => undefined,
};

export const questNodeDispatchLoopBroker = async ({
  isPlaying,
  registerProcess,
  unregisterProcess,
  onStepLine,
}: {
  isPlaying: () => boolean;
  onStepLine: (params: { questId: QuestId; workItemId: QuestWorkItemId; line: string }) => void;
  registerProcess?: (params: {
    processId: ProcessId;
    questId: QuestId;
    questWorkItemId: QuestWorkItemId;
    kill: () => void;
  }) => void;
  unregisterProcess?: (params: { processId: ProcessId }) => void;
}): Promise<AdapterResult> => {
  const ok = adapterResultContract.parse({ success: true });

  if (!isPlaying()) {
    return ok;
  }

  // Short poll — the runner has its own event-driven wake, so an idle scan should return
  // quickly instead of burning the MCP default 25s long-poll per check.
  const step = await questGetNextStepBroker({
    activeQuest: INERT_ACTIVE_QUEST_FACADE,
    longPollTotalMs: orchestrationDispatchStatics.loop.longPollTotalMs,
    longPollIntervalMs: orchestrationDispatchStatics.loop.longPollIntervalMs,
    // Stop the poll the moment the user pauses. Each retry scan WRITES (orphan recovery flips an
    // in_progress work item back to pending; the advance self-heal mints the next work item), so a
    // poll that outlives the pause keeps mutating quests the dispatcher was stopped for.
    shouldKeepPolling: isPlaying,
  });

  // Re-read AFTER the scan, not just before it. The scan is a long poll: it sits waiting for work
  // for up to `longPollTotalMs`, so the step it hands back can describe a quest that only became
  // dispatchable AFTER the user pressed pause. Acting on it would spawn a child (or run a
  // deterministic step) against a dispatcher the user has already stopped.
  if (!isPlaying()) {
    return ok;
  }

  if (step.type === 'idle') {
    return ok;
  }

  if (step.type === 'run-step') {
    const stepQuestId = step.questId;
    const stepWorkItemId = step.workItemId;
    // The handler owns its own work-item record — `in_progress`, then the classified word — and the
    // ROUTER decides what the scope does with that word on the next scan, so the loop just recurses.
    await questRunStepBroker({
      step,
      onLine: (line: string): void => {
        onStepLine({ questId: stepQuestId, workItemId: stepWorkItemId, line });
      },
    });
  } else if (step.type === 'spawn-agents') {
    await spawnBatchLayerBroker({
      agents: step.agents,
      // Threaded so an API-overload backoff inside the spawn layer — which can sleep for minutes
      // waiting out an Anthropic 529 — sees a pause and abandons its retry instead of respawning.
      isPlaying,
      ...(registerProcess === undefined ? {} : { registerProcess }),
      ...(unregisterProcess === undefined ? {} : { unregisterProcess }),
    });
  } else {
    // `run-ward` / `run-riftcarver` — still typed on `NextStep`, but nothing produces them any
    // more (see the file header). Named rather than silent, so a future producer regression is a
    // thrown message instead of a batch call missing `.agents`.
    throw new Error(
      `questNodeDispatchLoopBroker: unreachable NextStep type "${step.type}" — no producer mints a step-less command item any more`,
    );
  }

  return questNodeDispatchLoopBroker({
    isPlaying,
    onStepLine,
    ...(registerProcess === undefined ? {} : { registerProcess }),
    ...(unregisterProcess === undefined ? {} : { unregisterProcess }),
  });
};
