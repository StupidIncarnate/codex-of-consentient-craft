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
import { questEnqueueRecoverableBroker } from '../../../brokers/quest/enqueue-recoverable/quest-enqueue-recoverable-broker';
import { questExecutionQueueRunnerBroker } from '../../../brokers/quest/execution-queue-runner/quest-execution-queue-runner-broker';
import { questGetBroker } from '../../../brokers/quest/get/quest-get-broker';
import { executionQueueBootstrapState } from '../../../state/execution-queue-bootstrap/execution-queue-bootstrap-state';
import { orchestrationEventsState } from '../../../state/orchestration-events/orchestration-events-state';
import { orchestrationProcessesState } from '../../../state/orchestration-processes/orchestration-processes-state';
import { questExecutionQueueState } from '../../../state/quest-execution-queue/quest-execution-queue-state';
import { webPresenceState } from '../../../state/web-presence/web-presence-state';
import { PauseActiveHeadLayerResponder } from './pause-active-head-layer-responder';
import { RunOrchestrationLoopLayerResponder } from './run-orchestration-loop-layer-responder';

const RUNNER_PROCESS_ID = processIdContract.parse('execution-queue-runner');

// Debounce window for presence-false → pause-active-head. React StrictMode and SPA
// route transitions can briefly drop the WebSocket (close → reopen within tens of
// milliseconds); without this delay, the brief presence-false window kills the active
// head's CLI mid-stream and the loop strands the work item in `in_progress`.
const PRESENCE_FALSE_DEBOUNCE_MS = 750;

const state: {
  runner: QuestExecutionQueueRunnerController | null;
  presenceHandler: (({ isPresent }: { isPresent: boolean }) => void) | null;
  pendingPauseTimer: ReturnType<typeof setTimeout> | null;
} = {
  runner: null,
  presenceHandler: null,
  pendingPauseTimer: null,
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

  state.presenceHandler = ({ isPresent }: { isPresent: boolean }): void => {
    if (isPresent) {
      // A new presence-true cancels any pending pause kicked off by a brief drop —
      // the most common cause of a flapped presence is a SPA route transition that
      // closes and immediately reopens the WebSocket.
      if (state.pendingPauseTimer !== null) {
        clearTimeout(state.pendingPauseTimer);
        state.pendingPauseTimer = null;
      }

      const shouldRecover = !executionQueueBootstrapState.getHasRecoveredOnce();
      if (shouldRecover) {
        executionQueueBootstrapState.markRecovered();
      }
      const recoveryPromise = shouldRecover
        ? questEnqueueRecoverableBroker({
            enqueue: ({ entry }): void => {
              questExecutionQueueState.enqueue({ entry });
            },
            findProcessByQuestId: ({ questId }): unknown =>
              orchestrationProcessesState.findByQuestId({ questId }),
          }).then(
            () => undefined,
            (error: unknown): undefined => {
              process.stderr.write(
                `[execution-queue-bootstrap] recovery sweep failed: ${String(error)}\n`,
              );
              return undefined;
            },
          )
        : Promise.resolve();
      recoveryPromise
        .then(async () => runner.kick())
        .catch((error: unknown) => {
          process.stderr.write(
            `[execution-queue-bootstrap] presence kick failed: ${String(error)}\n`,
          );
        });
      return;
    }
    // Debounce the pause: only fire if presence stays false past the debounce window.
    // Catches React StrictMode double-mount and short SPA route transitions that briefly
    // drop the WS without intent to actually pause execution.
    if (state.pendingPauseTimer !== null) {
      clearTimeout(state.pendingPauseTimer);
    }
    state.pendingPauseTimer = setTimeout(() => {
      state.pendingPauseTimer = null;
      // Re-check presence — if it flipped back to true during the debounce window, skip.
      if (webPresenceState.getIsPresent()) {
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
    }, PRESENCE_FALSE_DEBOUNCE_MS);
  };
  webPresenceState.onChange(state.presenceHandler);

  return adapterResultContract.parse({ success: true });
};
