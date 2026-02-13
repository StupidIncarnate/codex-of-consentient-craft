/**
 * PURPOSE: Adapter for StartOrchestrator.removeProject that wraps the orchestrator package
 *
 * USAGE:
 * await orchestratorRemoveProjectAdapter({ projectId });
 * // Returns: void or throws error
 */

import { StartOrchestrator } from '@dungeonmaster/orchestrator';
import type { ProjectId } from '@dungeonmaster/shared/contracts';

export const orchestratorRemoveProjectAdapter = async ({
  projectId,
}: {
  projectId: ProjectId;
}): Promise<void> => StartOrchestrator.removeProject({ projectId });
