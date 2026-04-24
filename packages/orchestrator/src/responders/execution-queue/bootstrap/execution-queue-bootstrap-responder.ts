/**
 * PURPOSE: Wires the cross-guild quest execution queue runner to real state + event callbacks on orchestrator startup. Idempotent — subsequent calls are no-ops.
 *
 * USAGE:
 * ExecutionQueueBootstrapResponder();
 * // Queue runner is now subscribed to queue changes. Enqueuing entries advances the queue
 * // through questOrchestrationLoopBroker calls per head. Phase 7 wires enqueue sites.
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

const RUNNER_PROCESS_ID = processIdContract.parse('execution-queue-runner');

const state: { runner: QuestExecutionQueueRunnerController | null } = {
  runner: null,
};

export const ExecutionQueueBootstrapResponder = (): AdapterResult => {
  if (state.runner !== null) {
    return adapterResultContract.parse({ success: true });
  }

  state.runner = questExecutionQueueRunnerBroker({
    getHead: (): QuestQueueEntry | undefined => questExecutionQueueState.getActive(),
    dequeueHead: (): QuestQueueEntry | undefined => questExecutionQueueState.dequeueHead(),
    markHeadStarted: (): void => {
      questExecutionQueueState.markHeadStarted();
    },
    setHeadError: ({ message }: { message: string }): void => {
      questExecutionQueueState.setHeadError({ message });
    },
    onQueueChange: ({ handler }: { handler: () => void }): void => {
      questExecutionQueueState.onChange(handler);
    },
    offQueueChange: ({ handler }: { handler: () => void }): void => {
      questExecutionQueueState.offChange(handler);
    },
    // Phase 6 wires real web-presence. Phase 5 keeps runner always-enabled so that
    // any early enqueue surfaces via the error path rather than silently stalling.
    isWebPresent: (): boolean => true,
    runOrchestrationLoop: async (): Promise<void> =>
      Promise.reject(
        new Error(
          '[execution-queue-runner] runOrchestrationLoop not yet wired — Phase 7 replaces this stub',
        ),
      ),
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

  state.runner.start();
  return adapterResultContract.parse({ success: true });
};
