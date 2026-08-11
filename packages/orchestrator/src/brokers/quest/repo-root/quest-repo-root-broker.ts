/**
 * PURPOSE: Walks up from a quest's guild path to the nearest `.dungeonmaster.json` ancestor.
 * questCwdResolveBroker calls this ONLY as its fallback for a quest that predates worktrees and
 * records no `worktreePath`. Reach for this broker directly only when that same legacy,
 * no-recorded-worktree case applies outside questCwdResolveBroker's own flow — every other
 * quest-scoped cwd lookup should call questCwdResolveBroker instead, which prefers the quest's
 * own recorded worktree when one exists.
 *
 * USAGE:
 * const repoRoot = await questRepoRootBroker({ questId });
 * // Returns the RepoRootCwd that owns the quest's guild
 */

import { cwdResolveBroker } from '@dungeonmaster/shared/brokers';
import { filePathContract, repoRootCwdContract } from '@dungeonmaster/shared/contracts';
import type { QuestId, RepoRootCwd } from '@dungeonmaster/shared/contracts';

import { guildGetBroker } from '../../guild/get/guild-get-broker';
import { questFindQuestPathBroker } from '../find-quest-path/quest-find-quest-path-broker';

export const questRepoRootBroker = async ({
  questId,
}: {
  questId: QuestId;
}): Promise<RepoRootCwd> => {
  const { guildId } = await questFindQuestPathBroker({ questId });
  const guild = await guildGetBroker({ guildId });
  const startPath = filePathContract.parse(guild.path);

  try {
    return await cwdResolveBroker({ startPath, kind: 'repo-root' });
  } catch {
    return repoRootCwdContract.parse(guild.path);
  }
};
