/**
 * PURPOSE: Adapter for StartOrchestrator.addQuest that wraps the orchestrator package
 *
 * USAGE:
 * const result = await orchestratorAddQuestAdapter({ title, userRequest, guildId });
 * // Returns: AddQuestResult or throws error
 */

import { StartOrchestrator } from '@dungeonmaster/orchestrator';
import type { AddQuestResult } from '@dungeonmaster/orchestrator';
import type { GuildId } from '@dungeonmaster/shared/contracts';

export const orchestratorAddQuestAdapter = async ({
  title,
  userRequest,
  guildId,
}: {
  title: string;
  userRequest: string;
  guildId: GuildId;
}): Promise<AddQuestResult> => StartOrchestrator.addQuest({ title, userRequest, guildId });
