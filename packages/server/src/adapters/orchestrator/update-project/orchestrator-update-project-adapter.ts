/**
 * PURPOSE: Adapter for StartOrchestrator.updateProject that wraps the orchestrator package
 *
 * USAGE:
 * const result = await orchestratorUpdateProjectAdapter({ projectId, name, path });
 * // Returns: Project or throws error
 */

import { StartOrchestrator } from '@dungeonmaster/orchestrator';
import type { Project, ProjectId, ProjectName, ProjectPath } from '@dungeonmaster/shared/contracts';

export const orchestratorUpdateProjectAdapter = async ({
  projectId,
  name,
  path,
}: {
  projectId: ProjectId;
  name?: ProjectName;
  path?: ProjectPath;
}): Promise<Project> =>
  StartOrchestrator.updateProject({
    projectId,
    ...(name !== undefined && { name }),
    ...(path !== undefined && { path }),
  });
