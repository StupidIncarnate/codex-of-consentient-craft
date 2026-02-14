/**
 * PURPOSE: Adapter for StartOrchestrator.addGuild that wraps the orchestrator package
 *
 * USAGE:
 * const result = await orchestratorAddGuildAdapter({ name, path });
 * // Returns: Guild or throws error
 */

import { StartOrchestrator } from '@dungeonmaster/orchestrator';
import type { Guild, GuildName, GuildPath } from '@dungeonmaster/shared/contracts';

export const orchestratorAddGuildAdapter = async ({
  name,
  path,
}: {
  name: GuildName;
  path: GuildPath;
}): Promise<Guild> => StartOrchestrator.addGuild({ name, path });
