/**
 * PURPOSE: Walks up from a quest's guild path to the nearest `.dungeonmaster.json` ancestor,
 * trusting the answer only when the guild path is actually reachable under it. A bare guild
 * directory carrying no `.dungeonmaster.json` of its own does not make the walk-up reject — it
 * keeps climbing until it finds SOME ancestor's config, which may belong to an unrelated project
 * (an enclosing checkout) rather than to this guild. questCwdResolveBroker calls this ONLY as its
 * fallback for a quest that predates worktrees and records no `worktreePath`. Reach for this
 * broker directly only when that same legacy, no-recorded-worktree case applies outside
 * questCwdResolveBroker's own flow — every other quest-scoped cwd lookup should call
 * questCwdResolveBroker instead, which prefers the quest's own recorded worktree when one exists.
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
    const resolved = await cwdResolveBroker({ startPath, kind: 'repo-root' });

    // The walk-up can only ever produce a real ancestor-or-self of startPath, so this is the
    // one check that catches an ancestor belonging to a DIFFERENT project entirely (mirrors the
    // catch below, which already falls back to guild.path on an outright rejection).
    const guildPathValue = String(startPath);
    const resolvedRepoRootValue = String(resolved);
    const resolvedOwnsGuildPath =
      guildPathValue === resolvedRepoRootValue ||
      guildPathValue.startsWith(`${resolvedRepoRootValue}/`);

    return resolvedOwnsGuildPath ? resolved : repoRootCwdContract.parse(guild.path);
  } catch {
    return repoRootCwdContract.parse(guild.path);
  }
};
