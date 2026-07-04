/**
 * PURPOSE: The Node-run orchestration loop — drives the SAME get-next-step state machine that
 * /dumpster-launch polls, but dispatches by spawning headless Claude CLI children instead of
 * Task() sub-agents. One recursion per dispatch decision: spawn-agents → spawn the batch and
 * await exits; run-ward → run ward synchronously; idle → return control to the runner (which
 * re-kicks on wake events — no sleep-polling). Checks isPlaying() between steps as the graceful
 * pause point: in-flight children finish, nothing new dispatches.
 *
 * USAGE:
 * await questNodeDispatchLoopBroker({ isPlaying: () => orchestrationDispatchState.getIsPlaying() });
 * // Resolves when paused or when the state machine reports idle
 *
 * WHY isPlaying is a parameter: brokers cannot import state/ — the bootstrap responder supplies
 * the real orchestrationDispatchState facade; tests inject a stub.
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
}: {
  isPlaying: () => boolean;
  registerProcess?: (params: {
    processId: ProcessId;
    questId: QuestId;
    questWorkItemId: QuestWorkItemId;
    kill: () => void;
  }) => void;
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
  });

  if (step.type === 'idle') {
    return ok;
  }

  if (step.type === 'run-ward') {
    await questRunWardBroker({
      questId: step.questId,
      workItemId: step.workItemId,
      mode: step.mode,
    });
  } else {
    await spawnBatchLayerBroker({
      agents: step.agents,
      ...(registerProcess === undefined ? {} : { registerProcess }),
    });
  }

  return questNodeDispatchLoopBroker({
    isPlaying,
    ...(registerProcess === undefined ? {} : { registerProcess }),
  });
};
