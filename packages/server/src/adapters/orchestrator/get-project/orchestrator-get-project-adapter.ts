/**
 * PURPOSE: Adapter for StartOrchestrator.getProject that wraps the orchestrator package
 *
 * USAGE:
 * const result = await orchestratorGetProjectAdapter({ projectId });
 * // Returns: Project or throws error
 */

import { StartOrchestrator } from '@dungeonmaster/orchestrator';
import type { Project, ProjectId } from '@dungeonmaster/shared/contracts';

export const orchestratorGetProjectAdapter = async ({
  projectId,
}: {
  projectId: ProjectId;
}): Promise<Project> => StartOrchestrator.getProject({ projectId });
