/**
 * PURPOSE: Adapter for StartOrchestrator.listProjects that wraps the orchestrator package
 *
 * USAGE:
 * const result = await orchestratorListProjectsAdapter();
 * // Returns: ProjectListItem[] or throws error
 */

import { StartOrchestrator } from '@dungeonmaster/orchestrator';
import type { ProjectListItem } from '@dungeonmaster/shared/contracts';

export const orchestratorListProjectsAdapter = async (): Promise<ProjectListItem[]> =>
  StartOrchestrator.listProjects();
