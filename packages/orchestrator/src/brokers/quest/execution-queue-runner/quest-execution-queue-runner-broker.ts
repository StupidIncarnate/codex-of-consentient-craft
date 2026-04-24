/**
 * PURPOSE: Runs the cross-guild quest execution queue — factory returns a controller whose `kick` drains head→loop→dequeue. Runtime wires real state + events; tests inject mocks.
 *
 * USAGE:
 * const runner = questExecutionQueueRunnerBroker({
 *   getHead, dequeueHead, markHeadStarted, setHeadError,
 *   onQueueChange, offQueueChange, isWebPresent,
 *   runOrchestrationLoop, getQuestStatus,
 *   emitQueueUpdated, emitQueueError,
 * });
 * runner.start();
 * await runner.kick();
 *
 * WHEN-TO-USE: Wire once at StartOrchestrator bootstrap to drive the cross-guild queue.
 * WHEN-NOT-TO-USE: Do not import web-presence or start-responder state here — Phase 6/7 wire those.
 */

import type { AdapterResult } from '@dungeonmaster/shared/contracts';
import { adapterResultContract } from '@dungeonmaster/shared/contracts';

import type {
  QuestExecutionQueueChangeHandler,
  QuestExecutionQueueRunnerController,
  QuestExecutionQueueRunnerDeps,
} from '../../../contracts/quest-execution-queue-runner/quest-execution-queue-runner-contract';
import { drainOnceLayerBroker } from './drain-once-layer-broker';

export const questExecutionQueueRunnerBroker = ({
  getHead,
  dequeueHead,
  markHeadStarted,
  setHeadError,
  removeByQuestId,
  onQueueChange,
  offQueueChange,
  isWebPresent,
  runOrchestrationLoop,
  getQuestStatus,
  emitQueueUpdated,
  emitQueueError,
}: QuestExecutionQueueRunnerDeps): QuestExecutionQueueRunnerController => {
  const ok = adapterResultContract.parse({ success: true });

  const internal: {
    running: boolean;
    kickPending: boolean;
    changeHandler: QuestExecutionQueueChangeHandler | null;
  } = {
    running: false,
    kickPending: false,
    changeHandler: null,
  };

  const controller: QuestExecutionQueueRunnerController = {
    start: (): AdapterResult => {
      if (internal.changeHandler !== null) {
        return ok;
      }
      internal.changeHandler = (): void => {
        controller.kick().catch((error: unknown) => {
          process.stderr.write(`[execution-queue-runner] kick failed: ${String(error)}\n`);
        });
      };
      onQueueChange({ handler: internal.changeHandler });
      return ok;
    },

    stop: (): AdapterResult => {
      if (internal.changeHandler === null) {
        return ok;
      }
      offQueueChange({ handler: internal.changeHandler });
      internal.changeHandler = null;
      return ok;
    },

    kick: async (): Promise<AdapterResult> => {
      if (internal.running) {
        internal.kickPending = true;
        return ok;
      }
      internal.running = true;
      try {
        await drainOnceLayerBroker({
          getHead,
          dequeueHead,
          markHeadStarted,
          setHeadError,
          removeByQuestId,
          isWebPresent,
          runOrchestrationLoop,
          getQuestStatus,
          emitQueueUpdated,
          emitQueueError,
        });
      } finally {
        const shouldRekick = internal.kickPending;
        internal.running = false;
        internal.kickPending = false;
        if (shouldRekick) {
          await controller.kick();
        }
      }
      return ok;
    },
  };

  return controller;
};
