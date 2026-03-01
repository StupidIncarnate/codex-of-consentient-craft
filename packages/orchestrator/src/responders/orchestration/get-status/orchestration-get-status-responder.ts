/**
 * PURPOSE: Retrieves the current status of an orchestration process by processId
 *
 * USAGE:
 * const status = OrchestrationGetStatusResponder({ processId });
 * // Returns OrchestrationStatus or throws if process not found
 */

import type { OrchestrationStatus, ProcessId } from '@dungeonmaster/shared/contracts';

import { orchestrationProcessesState } from '../../../state/orchestration-processes/orchestration-processes-state';

export const OrchestrationGetStatusResponder = ({
  processId,
}: {
  processId: ProcessId;
}): OrchestrationStatus => {
  const status = orchestrationProcessesState.getStatus({ processId });

  if (!status) {
    throw new Error(`Process not found: ${processId}`);
  }

  return status;
};
