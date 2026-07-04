/**
 * PURPOSE: Wires the cross-guild execution-queue change broadcast on orchestrator startup.
 * Idempotent — subsequent calls are no-ops. Dispatch is owned by /dumpster-launch (via the MCP
 * get-next-step tool) or the Node dispatch runner (via OrchestrationDispatchBootstrapResponder);
 * this bootstrap only keeps WS clients in sync with queue mutations.
 *
 * USAGE:
 * ExecutionQueueBootstrapResponder();
 * // Every questExecutionQueueState mutation now emits `execution-queue-updated`.
 *
 * WHEN-TO-USE: Called once from StartOrchestrator module load.
 * WHEN-NOT-TO-USE: Not for request-scoped invocation.
 */

import type { AdapterResult } from '@dungeonmaster/shared/contracts';
import { adapterResultContract, processIdContract } from '@dungeonmaster/shared/contracts';

import { orchestrationEventsState } from '../../../state/orchestration-events/orchestration-events-state';
import { questExecutionQueueState } from '../../../state/quest-execution-queue/quest-execution-queue-state';

const RUNNER_PROCESS_ID = processIdContract.parse('execution-queue-runner');

const state: {
  installed: boolean;
} = {
  installed: false,
};

export const ExecutionQueueBootstrapResponder = (): AdapterResult => {
  if (state.installed) {
    return adapterResultContract.parse({ success: true });
  }
  state.installed = true;

  // Broadcast `execution-queue-updated` on every queue mutation so the web's
  // `useQuestQueueBinding` re-fetches. Mutations arrive from the Start-Quest enqueue,
  // the outbox-driven sync listener (status/active-session sync, terminal dequeue),
  // and recovery enqueues.
  questExecutionQueueState.onChange((): void => {
    orchestrationEventsState.emit({
      type: 'execution-queue-updated',
      processId: RUNNER_PROCESS_ID,
      payload: {},
    });
  });

  return adapterResultContract.parse({ success: true });
};
