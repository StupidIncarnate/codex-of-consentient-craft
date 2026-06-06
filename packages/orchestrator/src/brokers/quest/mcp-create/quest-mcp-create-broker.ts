/**
 * PURPOSE: Thin wrapper for the MCP `create-quest` tool — resolves the repo root from the MCP server's process cwd (inherited from the Claude Code session that ran `/dumpster-create` in a specific repo), reuses the registered guild that covers that repo root, or auto-creates one anchored to it, then seeds a quest with the supplied userRequest via questUserAddBroker and returns `{questId, guildSlug}` so the slash command can route the browser at the spec view. ChaosWhisperer fills in the real title later via modify-quest.
 *
 * USAGE:
 * const { questId, guildSlug } = await questMcpCreateBroker({ userRequest });
 * // Returns: the newly-created quest's id + its guild's urlSlug
 *
 * WHEN-TO-USE: Wired in by the MCP `create-quest` tool dispatch. ChaosWhisperer in
 *   /dumpster-create calls create-quest as its first action; the cwd identifies which
 *   guild the new quest belongs to in a multi-guild dev install. A covering guild is
 *   reused; otherwise one is auto-created so quest creation never fails on a fresh repo.
 * WHEN-NOT-TO-USE: For user-initiated quest creation through the web UI — that path uses
 *   questUserAddBroker directly with a known guild.
 */

import { cwdResolveBroker } from '@dungeonmaster/shared/brokers';
import { pathBasenameAdapter, processCwdAdapter } from '@dungeonmaster/shared/adapters';
import {
  folderNameToGuildNameTransformer,
  nameToUrlSlugTransformer,
} from '@dungeonmaster/shared/transformers';
import { ProjectRootNotFoundError } from '@dungeonmaster/shared/errors';
import type {
  AddQuestInput,
  Guild,
  GuildListItem,
  QuestId,
  QuestType,
  RepoRootCwd,
  SessionId,
  UrlSlug,
} from '@dungeonmaster/shared/contracts';
import {
  addQuestInputContract,
  filePathContract,
  guildPathContract,
  repoRootCwdContract,
  urlSlugContract,
} from '@dungeonmaster/shared/contracts';

import { guildCoversRepoRootGuard } from '../../../guards/guild-covers-repo-root/guild-covers-repo-root-guard';
import { guildAddBroker } from '../../guild/add/guild-add-broker';
import { guildListBroker } from '../../guild/list/guild-list-broker';
import { questUserAddBroker } from '../user-add/quest-user-add-broker';

const PLACEHOLDER_TITLE = 'New Quest';

export const questMcpCreateBroker = async ({
  userRequest,
  questType,
  sessionId,
}: {
  userRequest: AddQuestInput['userRequest'];
  questType?: QuestType;
  sessionId?: SessionId;
}): Promise<{
  questId: QuestId;
  guildSlug: UrlSlug;
}> => {
  const cwd = processCwdAdapter();

  // Fall back to the literal cwd as the repo root when .dungeonmaster.json is absent
  // (cwdResolveBroker rejects with ProjectRootNotFoundError) so quest creation still
  // succeeds in a repo that has not been through full dungeonmaster init.
  let repoRoot: RepoRootCwd = repoRootCwdContract.parse(cwd);
  try {
    repoRoot = await cwdResolveBroker({ startPath: cwd, kind: 'repo-root' });
  } catch (error) {
    if (!(error instanceof ProjectRootNotFoundError)) {
      throw error;
    }
  }

  const guilds = await guildListBroker();
  const coveringGuild = guilds.find((guild) => guildCoversRepoRootGuard({ guild, repoRoot }));

  const selectedGuild: Guild | GuildListItem =
    coveringGuild ??
    (await guildAddBroker({
      name: folderNameToGuildNameTransformer({
        folderName: pathBasenameAdapter({ path: filePathContract.parse(repoRoot) }),
      }),
      path: guildPathContract.parse(repoRoot),
    }));

  const input = addQuestInputContract.parse({
    title: PLACEHOLDER_TITLE,
    userRequest,
    ...(questType !== undefined && { questType }),
  });

  const result = await questUserAddBroker({
    input,
    guildId: selectedGuild.id,
    ...(sessionId !== undefined && { sessionId }),
  });
  if (!result.success || !result.questId) {
    throw new Error(`Failed to create quest: ${result.error ?? 'unknown error'}`);
  }

  const guildSlug = selectedGuild.urlSlug
    ? urlSlugContract.parse(selectedGuild.urlSlug)
    : nameToUrlSlugTransformer({ name: selectedGuild.name });

  return {
    questId: result.questId,
    guildSlug,
  };
};
