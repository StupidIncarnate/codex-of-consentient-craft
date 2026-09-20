/**
 * PURPOSE: Finds which guild owns a quest by scanning every registered guild's quest list.
 * `guildListBroker`/`questListBroker` are imported BY PATH from the orchestrator's `/brokers`
 * subpath rather than through `StartOrchestrator` on the main barrel: importing anything from
 * that barrel evaluates `startup/start-orchestrator.ts`, which boots a rate-limits watcher and a
 * stale-process watchdog at module scope, and this package is a short-lived hydration tool, not
 * the long-running server those exist for.
 *
 * USAGE:
 * await questOwningGuildFindBroker({ questId });
 * // Returns the GuildId of the guild whose quest list contains this questId; throws if none does
 */
import { guildListBroker, questListBroker } from '@dungeonmaster/orchestrator/brokers';
import type { GuildId, QuestId } from '@dungeonmaster/shared/contracts';

export const questOwningGuildFindBroker = async ({
  questId,
}: {
  questId: QuestId;
}): Promise<GuildId> => {
  const guilds = await guildListBroker();

  const perGuildQuests = await Promise.all(
    guilds.map(async (guild) => ({
      guildId: guild.id,
      quests: await questListBroker({ guildId: guild.id }),
    })),
  );

  const owner = perGuildQuests.find(({ quests }) => quests.some((quest) => quest.id === questId));

  if (!owner) {
    throw new Error(`questOwningGuildFindBroker: no guild owns quest ${questId}`);
  }

  return owner.guildId;
};
