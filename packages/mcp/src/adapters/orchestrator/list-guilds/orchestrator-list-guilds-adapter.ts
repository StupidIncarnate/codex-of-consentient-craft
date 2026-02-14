/**
 * PURPOSE: Adapter for StartOrchestrator.listGuilds that wraps the orchestrator package
 *
 * USAGE:
 * const result = await orchestratorListGuildsAdapter();
 * // Returns: GuildListItem[] or throws error
 */

import { StartOrchestrator } from '@dungeonmaster/orchestrator';
import type { GuildListItem } from '@dungeonmaster/shared/contracts';

export const orchestratorListGuildsAdapter = async (): Promise<GuildListItem[]> =>
  StartOrchestrator.listGuilds();
