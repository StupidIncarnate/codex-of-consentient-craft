/**
 * PURPOSE: Retrieves the current status of an orchestration process by processId
 *
 * USAGE:
 * const status = OrchestrationGetStatusResponder({ processId });
 * // Returns OrchestrationStatus or throws if process not found
 */

import type { OrchestrationStatus, ProcessId } from '@dungeonmaster/shared/contracts';
import { orchestrationStatusContract } from '@dungeonmaster/shared/contracts';

import { orchestrationProcessesState } from '../../../state/orchestration-processes/orchestration-processes-state';

export const OrchestrationGetStatusResponder = ({
  processId,
}: {
  processId: ProcessId;
}): OrchestrationStatus => {
  const process = orchestrationProcessesState.get({ processId });

  if (!process) {
    throw new Error(`Process not found: ${processId}`);
  }

  return orchestrationStatusContract.parse({
    processId: process.processId,
    questId: process.questId,
    phase: 'idle',
    completed: 0,
    total: 0,
    slots: [],
  });
};
