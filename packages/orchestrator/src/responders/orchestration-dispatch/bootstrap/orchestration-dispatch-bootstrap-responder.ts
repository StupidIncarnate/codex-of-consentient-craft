/**
 * PURPOSE: Wires the Node dispatch runner to real state + wake sources on orchestrator startup.
 * Idempotent — subsequent calls are no-ops. Re-emits every play/pause flip as a
 * `dispatch-state-changed` bus event so the server broadcasts it to WS clients. Boot
 * normalization (node-playing → paused) is deliberately NOT here — it lives in
 * OrchestrationDispatchNormalizeBootResponder, called only by the HTTP server's boot, because
 * this bootstrap also runs inside every MCP stdio child at StartOrchestrator module load and a
 * child spawned mid-play must not flip the shared file back to paused.
 *
 * USAGE:
 * OrchestrationDispatchBootstrapResponder();
 * // Runner is now kicked on play-press, queue changes, and quest-outbox-driven queue syncs.
 *
 * WHEN-TO-USE: Called once from StartOrchestrator module load.
 * WHEN-NOT-TO-USE: Not for request-scoped invocation.
 */

import type { AdapterResult } from '@dungeonmaster/shared/contracts';
import { adapterResultContract, processIdContract } from '@dungeonmaster/shared/contracts';

import { questNodeDispatchLoopBroker } from '../../../brokers/quest/node-dispatch-loop/quest-node-dispatch-loop-broker';
import { chatOutputEmitPayloadContract } from '../../../contracts/chat-output-emit-payload/chat-output-emit-payload-contract';
import { slotIndexContract } from '../../../contracts/slot-index/slot-index-contract';
import { wardLineToChatEntryTransformer } from '../../../transformers/ward-line-to-chat-entry/ward-line-to-chat-entry-transformer';
import { questNodeDispatchRunnerBroker } from '../../../brokers/quest/node-dispatch-runner/quest-node-dispatch-runner-broker';
import type { NodeDispatchRunnerController } from '../../../contracts/node-dispatch-runner/node-dispatch-runner-contract';
import { orchestrationDispatchState } from '../../../state/orchestration-dispatch/orchestration-dispatch-state';
import { orchestrationEventsState } from '../../../state/orchestration-events/orchestration-events-state';
import { orchestrationProcessesState } from '../../../state/orchestration-processes/orchestration-processes-state';
import { questExecutionQueueState } from '../../../state/quest-execution-queue/quest-execution-queue-state';

const RUNNER_PROCESS_ID = processIdContract.parse('node-dispatch-runner');

const state: {
  runner: NodeDispatchRunnerController | null;
} = {
  runner: null,
};

export const OrchestrationDispatchBootstrapResponder = (): AdapterResult => {
  if (state.runner !== null) {
    return adapterResultContract.parse({ success: true });
  }

  const runner = questNodeDispatchRunnerBroker({
    onWake: ({ handler }): void => {
      // Play pressed (dispatch-state flip) + quest/queue mutations (Start Quest enqueue AND
      // the outbox-driven sync listener's status updates, which fire on every quest.json
      // write — including signal-backs from child MCP processes).
      orchestrationDispatchState.onChange(handler);
      questExecutionQueueState.onChange(handler);
    },
    offWake: ({ handler }): void => {
      orchestrationDispatchState.offChange(handler);
      questExecutionQueueState.offChange(handler);
    },
    runLoop: async (): Promise<AdapterResult> =>
      questNodeDispatchLoopBroker({
        isPlaying: (): boolean => orchestrationDispatchState.getIsPlaying(),
        // Ward has no sessionId, so the JSONL watcher can never tail it — this is the only route
        // its output has to the workspace. Key the chat process on the work item so the execution
        // panel groups the lines under the ward row.
        onWardLine: ({ questId, workItemId, line }): void => {
          const chatProcessId = processIdContract.parse(String(workItemId));
          orchestrationEventsState.emit({
            type: 'chat-output',
            processId: chatProcessId,
            payload: chatOutputEmitPayloadContract.parse({
              processId: chatProcessId,
              chatProcessId,
              // Ward runs serially, one work item at a time — slot 0 is its only slot.
              slotIndex: slotIndexContract.parse(0),
              entries: [wardLineToChatEntryTransformer({ line })],
              questId,
              workItemId,
            }),
          });
        },
        registerProcess: ({ processId, questId, questWorkItemId, kill }): void => {
          orchestrationProcessesState.register({
            orchestrationProcess: { processId, questId, questWorkItemId, kill },
          });
        },
        // Every spawned child gets removed from the registry when it exits. Leaving entries behind
        // makes the stale-process watchdog warn about dead children forever, and an API-overload
        // retry can spawn a work item's child dozens of times over one outage.
        unregisterProcess: ({ processId }): void => {
          orchestrationProcessesState.remove({ processId });
        },
      }),
  });

  state.runner = runner;
  runner.start();

  // Broadcast play/pause flips to WS clients (server relays every non-per-quest bus event).
  orchestrationDispatchState.onChange((): void => {
    orchestrationEventsState.emit({
      type: 'dispatch-state-changed',
      processId: RUNNER_PROCESS_ID,
      payload: {},
    });
  });

  return adapterResultContract.parse({ success: true });
};
