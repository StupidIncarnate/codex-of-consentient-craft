/**
 * PURPOSE: Adapter for StartOrchestrator.removeGuild that wraps the orchestrator package
 *
 * USAGE:
 * await orchestratorRemoveGuildAdapter({ guildId });
 * // Returns: void or throws error
 */

import { StartOrchestrator } from '@dungeonmaster/orchestrator';
import type { AdapterResult, GuildId } from '@dungeonmaster/shared/contracts';

export const orchestratorRemoveGuildAdapter = async ({
  guildId,
}: {
  guildId: GuildId;
}): Promise<AdapterResult> => {
  await StartOrchestrator.removeGuild({ guildId });

  return { success: true as const };
};
