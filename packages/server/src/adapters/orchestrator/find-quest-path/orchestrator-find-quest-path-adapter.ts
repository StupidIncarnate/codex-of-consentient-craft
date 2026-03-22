/**
 * PURPOSE: Adapter for questFindQuestPathBroker that wraps the orchestrator package
 *
 * USAGE:
 * const { questPath, guildId } = await orchestratorFindQuestPathAdapter({ questId });
 * // Returns: { questPath: AbsoluteFilePath, guildId: GuildId }
 */

import { questFindQuestPathBroker } from '@dungeonmaster/orchestrator';
import type { AbsoluteFilePath, GuildId, QuestId } from '@dungeonmaster/shared/contracts';

export const orchestratorFindQuestPathAdapter = async ({
  questId,
}: {
  questId: QuestId;
}): Promise<{ questPath: AbsoluteFilePath; guildId: GuildId }> =>
  questFindQuestPathBroker({ questId });
