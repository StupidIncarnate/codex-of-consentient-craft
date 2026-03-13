/**
 * PURPOSE: Scans all guilds for active quests and delegates recovery to the orchestration responder
 *
 * USAGE:
 * const recoveredQuestIds = await StartupRecoveryFlow();
 * // Returns array of quest IDs that were recovered across all guilds
 */

import type { Quest, QuestId } from '@dungeonmaster/shared/contracts';

import { GuildListResponder } from '../../responders/guild/list/guild-list-responder';
import { QuestListResponder } from '../../responders/quest/list/quest-list-responder';
import { QuestLoadResponder } from '../../responders/quest/load/quest-load-responder';
import { OrchestrationStartupRecoveryResponder } from '../../responders/orchestration/startup-recovery/orchestration-startup-recovery-responder';

export const StartupRecoveryFlow = async (): Promise<QuestId[]> => {
  const guilds = await GuildListResponder();
  const validGuilds = guilds.filter((guild) => guild.valid);

  const guildQuestResults = await Promise.all(
    validGuilds.map(async (guild) => {
      try {
        const questItems = await QuestListResponder({ guildId: guild.id });

        const loadResults = await Promise.all(
          questItems.map(async (item) => {
            try {
              return await QuestLoadResponder({ questId: item.id });
            } catch {
              return null;
            }
          }),
        );

        return loadResults.filter((quest): quest is Quest => quest !== null);
      } catch {
        return [];
      }
    }),
  );

  const allQuests = guildQuestResults.flat();

  return OrchestrationStartupRecoveryResponder({ quests: allQuests });
};
