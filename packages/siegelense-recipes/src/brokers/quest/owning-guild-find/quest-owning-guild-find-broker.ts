/**
 * PURPOSE: Finds which guild owns a quest by scanning every registered guild's quest list. Reach
 * for this over `questFindQuestPathBroker` (which answers the identical question): that broker is
 * a BARE named export from `@dungeonmaster/orchestrator`, and combining a bare-named-export mock
 * with a `StartOrchestrator.<method>` property mock in one test does not compose reliably —
 * measured directly, the property mock silently falls through to the real implementation. This
 * broker reaches the same answer through `StartOrchestrator` alone, so every caller in this
 * package can mock consistently, one way, everywhere.
 *
 * USAGE:
 * await questOwningGuildFindBroker({ questId });
 * // Returns the GuildId of the guild whose quest list contains this questId; throws if none does
 */
import { StartOrchestrator } from '@dungeonmaster/orchestrator';
import type { GuildId, QuestId } from '@dungeonmaster/shared/contracts';

export const questOwningGuildFindBroker = async ({
  questId,
}: {
  questId: QuestId;
}): Promise<GuildId> => {
  const guilds = await StartOrchestrator.listGuilds();

  const perGuildQuests = await Promise.all(
    guilds.map(async (guild) => ({
      guildId: guild.id,
      quests: await StartOrchestrator.listQuests({ guildId: guild.id }),
    })),
  );

  const owner = perGuildQuests.find(({ quests }) => quests.some((quest) => quest.id === questId));

  if (!owner) {
    throw new Error(`questOwningGuildFindBroker: no guild owns quest ${questId}`);
  }

  return owner.guildId;
};
