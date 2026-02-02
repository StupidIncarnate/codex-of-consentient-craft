/**
 * PURPOSE: Adapter for StartOrchestrator.getQuestStatus that wraps the orchestrator package
 *
 * USAGE:
 * const result = await orchestratorGetQuestStatusAdapter({ processId });
 * // Returns: OrchestrationStatus or throws error
 */

import { StartOrchestrator } from '@dungeonmaster/orchestrator';
import type { ProcessId, OrchestrationStatus } from '@dungeonmaster/shared/contracts';

export const orchestratorGetQuestStatusAdapter = async ({
  processId,
}: {
  processId: ProcessId;
}): Promise<OrchestrationStatus> => StartOrchestrator.getQuestStatus({ processId });
