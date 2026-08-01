/**
 * PURPOSE: The Node-run orchestration loop — drives the SAME get-next-step state machine that
 * /dumpster-launch polls, but dispatches by spawning headless Claude CLI children instead of
 * Task() sub-agents. One recursion per dispatch decision: spawn-agents → spawn the batch and
 * await exits; run-ward → run ward synchronously; idle → return control to the runner (which
 * re-kicks on wake events — no sleep-polling). isPlaying() is read TWICE per iteration — before
 * the scan and again after it, because the scan long-polls and can return work that only appeared
 * after a pause. That pair is the graceful pause point: in-flight children finish, nothing new
 * dispatches.
 *
 * USAGE:
 * await questNodeDispatchLoopBroker({ isPlaying: () => orchestrationDispatchState.getIsPlaying() });
 * // Resolves when paused or when the state machine reports idle
 *
 * WHY isPlaying is a parameter: brokers cannot import state/ — the bootstrap responder supplies
 * the real orchestrationDispatchState facade; tests inject a stub. `onWardLine` is a parameter for
 * the same reason, and is REQUIRED: ward is the one work item nothing else can stream (no
 * sessionId, so the JSONL watcher cannot see it), so dropping this callback means minutes of a
 * dead panel with nothing at the call site to show for it.
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
import { questRunWardBroker } from '../run-ward/quest-run-ward-broker';
import { spawnBatchLayerBroker } from './spawn-batch-layer-broker';

const INERT_ACTIVE_QUEST_FACADE: ActiveQuestFacade = {
  setActive: (_: { questId: string | null }): void => undefined,
  clear: (): void => undefined,
};

export const questNodeDispatchLoopBroker = async ({
  isPlaying,
  registerProcess,
  unregisterProcess,
  onWardLine,
}: {
  isPlaying: () => boolean;
  onWardLine: (params: { questId: QuestId; workItemId: QuestWorkItemId; line: string }) => void;
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
  // dispatchable AFTER the user pressed pause. Acting on it would spawn a child (or run ward)
  // against a dispatcher the user has already stopped.
  if (!isPlaying()) {
    return ok;
  }

  if (step.type === 'idle') {
    return ok;
  }

  if (step.type === 'run-ward') {
    const wardQuestId = step.questId;
    const wardWorkItemId = step.workItemId;
    await questRunWardBroker({
      questId: wardQuestId,
      workItemId: wardWorkItemId,
      mode: step.mode,
      onLine: (line: string): void => {
        onWardLine({ questId: wardQuestId, workItemId: wardWorkItemId, line });
      },
    });
  } else {
    await spawnBatchLayerBroker({
      agents: step.agents,
      // Threaded so an API-overload backoff inside the spawn layer — which can sleep for minutes
      // waiting out an Anthropic 529 — sees a pause and abandons its retry instead of respawning.
      isPlaying,
      ...(registerProcess === undefined ? {} : { registerProcess }),
      ...(unregisterProcess === undefined ? {} : { unregisterProcess }),
    });
  }

  return questNodeDispatchLoopBroker({
    isPlaying,
    onWardLine,
    ...(registerProcess === undefined ? {} : { registerProcess }),
    ...(unregisterProcess === undefined ? {} : { unregisterProcess }),
  });
};
