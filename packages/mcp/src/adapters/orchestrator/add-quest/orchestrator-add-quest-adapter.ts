/**
 * PURPOSE: Adapter for StartOrchestrator.addQuest that wraps the orchestrator package
 *
 * USAGE:
 * const result = await orchestratorAddQuestAdapter({ title, userRequest, projectId });
 * // Returns: AddQuestResult or throws error
 */

import { StartOrchestrator } from '@dungeonmaster/orchestrator';
import type { AddQuestResult } from '@dungeonmaster/orchestrator';
import type { ProjectId } from '@dungeonmaster/shared/contracts';

export const orchestratorAddQuestAdapter = async ({
  title,
  userRequest,
  projectId,
}: {
  title: string;
  userRequest: string;
  projectId: ProjectId;
}): Promise<AddQuestResult> => StartOrchestrator.addQuest({ title, userRequest, projectId });
