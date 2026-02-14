/**
 * PURPOSE: Adapter for StartOrchestrator.removeGuild that wraps the orchestrator package
 *
 * USAGE:
 * await orchestratorRemoveGuildAdapter({ guildId });
 * // Returns: void or throws error
 */

import { StartOrchestrator } from '@dungeonmaster/orchestrator';
import type { GuildId } from '@dungeonmaster/shared/contracts';

export const orchestratorRemoveGuildAdapter = async ({
  guildId,
}: {
  guildId: GuildId;
}): Promise<void> => StartOrchestrator.removeGuild({ guildId });
