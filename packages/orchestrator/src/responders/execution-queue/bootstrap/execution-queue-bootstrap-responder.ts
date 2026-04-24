/**
 * PURPOSE: Wires the cross-guild quest execution queue runner to real state + event callbacks on orchestrator startup. Idempotent — subsequent calls are no-ops.
 *
 * USAGE:
 * ExecutionQueueBootstrapResponder();
 * // Queue runner is now subscribed to queue changes and to web-presence flips. On
 * // presence true the runner drains the queue; on presence false the active head (if
 * // pauseable) is sent through PauseActiveHeadLayerResponder.
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
import { isQuestPauseableQuestStatusGuard } from '@dungeonmaster/shared/guards';

import type { QuestExecutionQueueRunnerController } from '../../../contracts/quest-execution-queue-runner/quest-execution-queue-runner-contract';
import { questExecutionQueueRunnerBroker } from '../../../brokers/quest/execution-queue-runner/quest-execution-queue-runner-broker';
import { questGetBroker } from '../../../brokers/quest/get/quest-get-broker';
import { orchestrationEventsState } from '../../../state/orchestration-events/orchestration-events-state';
import { questExecutionQueueState } from '../../../state/quest-execution-queue/quest-execution-queue-state';
import { webPresenceState } from '../../../state/web-presence/web-presence-state';
import { PauseActiveHeadLayerResponder } from './pause-active-head-layer-responder';

const RUNNER_PROCESS_ID = processIdContract.parse('execution-queue-runner');

const state: {
  runner: QuestExecutionQueueRunnerController | null;
  presenceHandler: (({ isPresent }: { isPresent: boolean }) => void) | null;
} = {
  runner: null,
  presenceHandler: null,
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
    onQueueChange: ({ handler }: { handler: () => void }): void => {
      questExecutionQueueState.onChange(handler);
    },
    offQueueChange: ({ handler }: { handler: () => void }): void => {
      questExecutionQueueState.offChange(handler);
    },
    isWebPresent: (): boolean => webPresenceState.getIsPresent(),
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

  state.runner = runner;
  runner.start();

  state.presenceHandler = ({ isPresent }: { isPresent: boolean }): void => {
    if (isPresent) {
      runner.kick().catch((error: unknown) => {
        process.stderr.write(
          `[execution-queue-bootstrap] presence kick failed: ${String(error)}\n`,
        );
      });
      return;
    }
    const head = questExecutionQueueState.getActive();
    if (head === undefined) {
      return;
    }
    if (!isQuestPauseableQuestStatusGuard({ status: head.status })) {
      return;
    }
    PauseActiveHeadLayerResponder({
      questId: head.questId,
      guildId: head.guildId,
      status: head.status,
    }).catch((error: unknown) => {
      process.stderr.write(
        `[execution-queue-bootstrap] pause-on-presence-false failed: ${String(error)}\n`,
      );
    });
  };
  webPresenceState.onChange(state.presenceHandler);

  return adapterResultContract.parse({ success: true });
};
