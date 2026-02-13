/**
 * PURPOSE: Adapter for StartOrchestrator.addProject that wraps the orchestrator package
 *
 * USAGE:
 * const result = await orchestratorAddProjectAdapter({ name, path });
 * // Returns: Project or throws error
 */

import { StartOrchestrator } from '@dungeonmaster/orchestrator';
import type { Project, ProjectName, ProjectPath } from '@dungeonmaster/shared/contracts';

export const orchestratorAddProjectAdapter = async ({
  name,
  path,
}: {
  name: ProjectName;
  path: ProjectPath;
}): Promise<Project> => StartOrchestrator.addProject({ name, path });
