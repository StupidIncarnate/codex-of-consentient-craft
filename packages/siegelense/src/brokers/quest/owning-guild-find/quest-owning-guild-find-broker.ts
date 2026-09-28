/**
 * PURPOSE: Resolves the guild that owns a quest, for `start --quest <questId>` — the flag's own
 * `--help` promise ("files the instance's evidence under that quest's guild") had nothing behind it
 * before this file existed: `instanceStartBroker` forwarded whatever `--guild` supplied (`null` when
 * omitted) straight through with no lookup at all, so a bare `--quest` always filed evidence under
 * `unowned` regardless of which guild really held the quest. Mirrors
 * `@dungeonmaster/hydration-recipes`' own `questOwningGuildFindBroker` byte for byte in shape:
 * `guildListBroker`/`questListBroker` are imported BY PATH from the orchestrator's `/brokers` subpath
 * rather than through `StartOrchestrator` on the main barrel, because importing anything off that
 * barrel evaluates `startup/start-orchestrator.ts`, which boots a rate-limits watcher and a
 * stale-process watchdog at module scope — fatal for a short-lived `siegelense start` invocation,
 * which would otherwise never exit.
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

  if (owner === undefined) {
    throw new Error(
      `--quest ${questId} could not be resolved to a guild: no registered guild's quest list ` +
        `contains it. Pass --guild explicitly, or check that DUNGEONMASTER_HOME points at the ` +
        `home this quest's guild is registered under.`,
    );
  }

  return owner.guildId;
};
