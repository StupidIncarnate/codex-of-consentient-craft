/**
 * PURPOSE: Adapter for StartOrchestrator.addQuest that wraps the orchestrator package
 *
 * USAGE:
 * const result = await orchestratorAddQuestAdapter({ title, userRequest, startPath });
 * // Returns: AddQuestResult or throws error
 */

import { StartOrchestrator } from '@dungeonmaster/orchestrator';
import type { AddQuestResult } from '@dungeonmaster/orchestrator';
import type { FilePath } from '@dungeonmaster/shared/contracts';

export const orchestratorAddQuestAdapter = async ({
  title,
  userRequest,
  startPath,
}: {
  title: string;
  userRequest: string;
  startPath: FilePath;
}): Promise<AddQuestResult> => StartOrchestrator.addQuest({ title, userRequest, startPath });
