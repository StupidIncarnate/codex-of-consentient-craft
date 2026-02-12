/**
 * PURPOSE: Adapter for StartOrchestrator.getQuestStatus that wraps the orchestrator package
 *
 * USAGE:
 * const status = orchestratorGetQuestStatusAdapter({ processId });
 * // Returns: OrchestrationStatus or throws error
 */

import { StartOrchestrator } from '@dungeonmaster/orchestrator';
import type { OrchestrationStatus, ProcessId } from '@dungeonmaster/shared/contracts';

export const orchestratorGetQuestStatusAdapter = ({
  processId,
}: {
  processId: ProcessId;
}): OrchestrationStatus => StartOrchestrator.getQuestStatus({ processId });
