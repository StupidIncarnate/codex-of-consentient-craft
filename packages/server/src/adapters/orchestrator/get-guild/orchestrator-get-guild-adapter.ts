/**
 * PURPOSE: Adapter for StartOrchestrator.getGuild that wraps the orchestrator package
 *
 * USAGE:
 * const result = await orchestratorGetGuildAdapter({ guildId });
 * // Returns: Guild or throws error
 */

import { StartOrchestrator } from '@dungeonmaster/orchestrator';
import type { Guild, GuildId } from '@dungeonmaster/shared/contracts';

export const orchestratorGetGuildAdapter = async ({
  guildId,
}: {
  guildId: GuildId;
}): Promise<Guild> => StartOrchestrator.getGuild({ guildId });
