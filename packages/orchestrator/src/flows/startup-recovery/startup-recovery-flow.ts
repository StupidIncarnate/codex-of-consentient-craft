/**
 * PURPOSE: Scans all guilds for active quests and delegates recovery to the orchestration responder
 *
 * USAGE:
 * const recoveredQuestIds = await StartupRecoveryFlow();
 * // Returns array of quest IDs that were recovered across all guilds
 */

import type { QuestId } from '@dungeonmaster/shared/contracts';

import { GuildListResponder } from '../../responders/guild/list/guild-list-responder';
import { OrchestrationStartupRecoveryResponder } from '../../responders/orchestration/startup-recovery/orchestration-startup-recovery-responder';

export const StartupRecoveryFlow = async (): Promise<QuestId[]> => {
  const guilds = await GuildListResponder();

  return OrchestrationStartupRecoveryResponder({ guildItems: guilds });
};
