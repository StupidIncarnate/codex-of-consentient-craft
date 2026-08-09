/**
 * PURPOSE: Names the guild-path-to-repo-root resolution as its own broker so the worktree-prepare
 * piece (and any future caller) has one place to ask "what repo root owns this quest" instead of
 * inlining the five-line cwdResolveBroker-with-fallback shape already duplicated across
 * chat-spawn-broker, quest-get-blight-checklist-broker, spawn-batch-layer-broker,
 * run-chat-layer-broker, and chat-history-replay-broker. Those five call sites are left as-is —
 * a later operation item replaces them with a read of the quest's own recorded worktree path.
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
