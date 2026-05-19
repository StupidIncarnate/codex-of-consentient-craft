/**
 * PURPOSE: Thin wrapper for the MCP `create-quest` tool — looks up the registered guild whose path matches the current working directory (the MCP server's cwd, inherited from the Claude Code session that ran `/dumpster-create` in a specific repo), seeds a quest with the supplied userRequest via questUserAddBroker against that guild, and returns `{questId, guildSlug}` so the slash command can route the browser at the spec view. ChaosWhisperer fills in the real title later via modify-quest.
 *
 * USAGE:
 * const { questId, guildSlug } = await questMcpCreateBroker({ userRequest });
 * // Returns: the newly-created quest's id + its guild's urlSlug
 *
 * WHEN-TO-USE: Wired in by the MCP `create-quest` tool dispatch. ChaosWhisperer in
 *   /dumpster-create calls create-quest as its first action; the cwd identifies which
 *   guild the new quest belongs to in a multi-guild dev install.
 * WHEN-NOT-TO-USE: For user-initiated quest creation through the web UI — that path uses
 *   questUserAddBroker directly with a known guild.
 */

import { processCwdAdapter } from '@dungeonmaster/shared/adapters';
import { nameToUrlSlugTransformer } from '@dungeonmaster/shared/transformers';
import type { AddQuestInput, QuestId, UrlSlug } from '@dungeonmaster/shared/contracts';
import { addQuestInputContract, urlSlugContract } from '@dungeonmaster/shared/contracts';

import { guildListBroker } from '../../guild/list/guild-list-broker';
import { stripTrailingSlashTransformer } from '../../../transformers/strip-trailing-slash/strip-trailing-slash-transformer';
import { questUserAddBroker } from '../user-add/quest-user-add-broker';

const PLACEHOLDER_TITLE = 'New Quest';

export const questMcpCreateBroker = async ({
  userRequest,
}: {
  userRequest: AddQuestInput['userRequest'];
}): Promise<{
  questId: QuestId;
  guildSlug: UrlSlug;
}> => {
  const cwd = processCwdAdapter();
  const normalizedCwd = stripTrailingSlashTransformer({ path: cwd });

  const guilds = await guildListBroker();
  const matchingGuild = guilds.find(
    (guild) => stripTrailingSlashTransformer({ path: guild.path }) === normalizedCwd,
  );
  if (!matchingGuild) {
    throw new Error(
      `No guild registered for current directory: ${cwd}. Run \`dungeonmaster init\` in this repo first.`,
    );
  }

  const input = addQuestInputContract.parse({
    title: PLACEHOLDER_TITLE,
    userRequest,
  });

  const result = await questUserAddBroker({ input, guildId: matchingGuild.id });
  if (!result.success || !result.questId) {
    throw new Error(`Failed to create quest: ${result.error ?? 'unknown error'}`);
  }

  const guildSlug = matchingGuild.urlSlug
    ? urlSlugContract.parse(matchingGuild.urlSlug)
    : nameToUrlSlugTransformer({ name: matchingGuild.name });

  return {
    questId: result.questId,
    guildSlug,
  };
};
