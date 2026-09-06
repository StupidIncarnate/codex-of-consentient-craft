/**
 * PURPOSE: Adapter for questListBroker that wraps the orchestrator package
 *
 * USAGE:
 * const quests = await orchestratorListQuestsFullAdapter({ guildId });
 * // Returns: Quest[] — every loadable quest in the guild, whole
 *
 * WHEN-TO-USE: A caller that needs a guild's quests in FULL — their work items, their worktree
 *   path. `orchestratorListQuestsAdapter` is the sibling to reach for when a summary will do; it
 *   loads and parses exactly the same files, then narrows each to a `QuestListItem` and drops the
 *   rest. Asking it for summaries and then re-loading each quest one at a time pays for every file
 *   twice, and the second pass costs a whole-home scan per quest to find it again.
 */

import { questListBroker } from '@dungeonmaster/orchestrator';
import type { GuildId, Quest } from '@dungeonmaster/shared/contracts';

export const orchestratorListQuestsFullAdapter = async ({
  guildId,
}: {
  guildId: GuildId;
}): Promise<Quest[]> => questListBroker({ guildId });
