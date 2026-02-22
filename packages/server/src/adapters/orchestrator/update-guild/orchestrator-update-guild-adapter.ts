/**
 * PURPOSE: Adapter for StartOrchestrator.updateGuild that wraps the orchestrator package
 *
 * USAGE:
 * const result = await orchestratorUpdateGuildAdapter({ guildId, name, path });
 * // Returns: Guild or throws error
 */

import { StartOrchestrator } from '@dungeonmaster/orchestrator';
import type { Guild, GuildId, GuildName, GuildPath } from '@dungeonmaster/shared/contracts';

export const orchestratorUpdateGuildAdapter = async ({
  guildId,
  name,
  path,
}: {
  guildId: GuildId;
  name?: GuildName;
  path?: GuildPath;
}): Promise<Guild> =>
  StartOrchestrator.updateGuild({
    guildId,
    ...(name !== undefined && { name }),
    ...(path !== undefined && { path }),
  });
