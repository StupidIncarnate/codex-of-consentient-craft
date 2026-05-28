/**
 * PURPOSE: Wires the cross-guild quest execution queue runner to real state + event callbacks on orchestrator startup. Idempotent — subsequent calls are no-ops.
 *
 * USAGE:
 * ExecutionQueueBootstrapResponder();
 * // Queue runner is now subscribed to queue changes. Web-presence is not consulted —
 * // dispatch is owned by /dumpster-launch via the MCP get-next-step tool.
 *
 * WHEN-TO-USE: Called once from StartOrchestrator module load.
 * WHEN-NOT-TO-USE: Not for request-scoped invocation.
 */

import type { AdapterResult } from '@dungeonmaster/shared/contracts';
import {
  adapterResultContract,
  getQuestInputContract,
  processIdContract,
} from '@dungeonmaster/shared/contracts';
import type { QuestQueueEntry, QuestStatus } from '@dungeonmaster/shared/contracts';

import type { QuestExecutionQueueRunnerController } from '../../../contracts/quest-execution-queue-runner/quest-execution-queue-runner-contract';
import { questExecutionQueueRunnerBroker } from '../../../brokers/quest/execution-queue-runner/quest-execution-queue-runner-broker';
import { questGetBroker } from '../../../brokers/quest/get/quest-get-broker';
import { orchestrationEventsState } from '../../../state/orchestration-events/orchestration-events-state';
import { questExecutionQueueState } from '../../../state/quest-execution-queue/quest-execution-queue-state';
import { webPresenceState } from '../../../state/web-presence/web-presence-state';
import { RunOrchestrationLoopLayerResponder } from './run-orchestration-loop-layer-responder';

const RUNNER_PROCESS_ID = processIdContract.parse('execution-queue-runner');

const state: {
  runner: QuestExecutionQueueRunnerController | null;
} = {
  runner: null,
};

export const ExecutionQueueBootstrapResponder = (): AdapterResult => {
  if (state.runner !== null) {
    return adapterResultContract.parse({ success: true });
  }

  const runner = questExecutionQueueRunnerBroker({
    getHead: (): QuestQueueEntry | undefined => questExecutionQueueState.getActive(),
    dequeueHead: (): QuestQueueEntry | undefined => questExecutionQueueState.dequeueHead(),
    markHeadStarted: (): void => {
      questExecutionQueueState.markHeadStarted();
    },
    setHeadError: ({ message }: { message: string }): void => {
      questExecutionQueueState.setHeadError({ message });
    },
    removeByQuestId: ({ questId }: { questId: QuestQueueEntry['questId'] }): void => {
      questExecutionQueueState.removeByQuestId({ questId });
    },
    onQueueChange: ({ handler }: { handler: () => void }): void => {
      questExecutionQueueState.onChange(handler);
    },
    offQueueChange: ({ handler }: { handler: () => void }): void => {
      questExecutionQueueState.offChange(handler);
    },
    isWebPresent: (): boolean => webPresenceState.getIsPresent(),
    runOrchestrationLoop: async ({
      questId,
      guildId,
    }: {
      questId: QuestQueueEntry['questId'];
      guildId: QuestQueueEntry['guildId'];
    }): Promise<void> => {
      await RunOrchestrationLoopLayerResponder({ questId, guildId });
    },
    getQuestStatus: async ({
      questId,
    }: {
      questId: QuestQueueEntry['questId'];
      guildId: QuestQueueEntry['guildId'];
    }): Promise<QuestStatus | undefined> => {
      const result = await questGetBroker({
        input: getQuestInputContract.parse({ questId }),
      });
      if (!result.success || result.quest === undefined) {
        return undefined;
      }
      return result.quest.status;
    },
    emitQueueUpdated: (): void => {
      orchestrationEventsState.emit({
        type: 'execution-queue-updated',
        processId: RUNNER_PROCESS_ID,
        payload: {},
      });
    },
    emitQueueError: ({ message }: { message: string }): void => {
      orchestrationEventsState.emit({
        type: 'execution-queue-error',
        processId: RUNNER_PROCESS_ID,
        payload: { message },
      });
    },
  });

  state.runner = runner;
  runner.start();

  // Broadcast `execution-queue-updated` on every queue mutation so the web's
  // `useQuestQueueBinding` re-fetches. The runner's own onChange handler only
  // kicks the drain — it does not emit. Mutations done outside the runner
  // (status sync, active-session sync, recovery enqueue) would otherwise
  // silently update state without notifying WS clients.
  questExecutionQueueState.onChange((): void => {
    orchestrationEventsState.emit({
      type: 'execution-queue-updated',
      processId: RUNNER_PROCESS_ID,
      payload: {},
    });
  });

  return adapterResultContract.parse({ success: true });
};
