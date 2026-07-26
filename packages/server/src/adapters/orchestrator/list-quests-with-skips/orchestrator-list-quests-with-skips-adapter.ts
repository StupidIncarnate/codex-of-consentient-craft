/**
 * PURPOSE: Adapter for StartOrchestrator.listQuestsWithSkips that wraps the orchestrator package
 *
 * USAGE:
 * const result = await orchestratorListQuestsWithSkipsAdapter({ guildId });
 * // Returns: { quests: QuestListItem[], skipped: SkippedQuestFile[] } or throws error
 */

import { StartOrchestrator } from '@dungeonmaster/orchestrator';
import type { GuildId, QuestListResult } from '@dungeonmaster/shared/contracts';

export const orchestratorListQuestsWithSkipsAdapter = async ({
  guildId,
}: {
  guildId: GuildId;
}): Promise<QuestListResult> => StartOrchestrator.listQuestsWithSkips({ guildId });
