/**
 * PURPOSE: Test proxy for questOwningGuildFindBroker — composes the two cross-package orchestrator
 * broker proxies (`guildListBrokerProxy`, `questListBrokerProxy`), the same shape
 * `@dungeonmaster/hydration-recipes`' own `questOwningGuildFindBrokerProxy` uses for its byte-for-byte
 * twin.
 *
 * USAGE:
 * const proxy = questOwningGuildFindBrokerProxy();
 * proxy.succeeds({ guilds, questsByGuildId });
 */
import { guildListBrokerProxy } from '@dungeonmaster/orchestrator/brokers/guild/list/guild-list-broker.proxy';
import { questListBrokerProxy } from '@dungeonmaster/orchestrator/brokers/quest/list/quest-list-broker.proxy';
import { GuildIdStub } from '@dungeonmaster/shared/contracts/guild-id/guild-id.stub';
import type { GuildListItemStub } from '@dungeonmaster/shared/contracts/guild-list-item/guild-list-item.stub';
import type { QuestStub } from '@dungeonmaster/shared/contracts/quest/quest.stub';

type GuildListItem = ReturnType<typeof GuildListItemStub>;
type Quest = ReturnType<typeof QuestStub>;

export const questOwningGuildFindBrokerProxy = (): {
  succeeds: (params: {
    guilds: readonly GuildListItem[];
    questsByGuildId: Readonly<Record<string, readonly Quest[]>>;
  }) => void;
} => {
  const guildListProxy = guildListBrokerProxy();
  const questListProxy = questListBrokerProxy();

  return {
    succeeds: ({
      guilds,
      questsByGuildId,
    }: {
      guilds: readonly GuildListItem[];
      questsByGuildId: Readonly<Record<string, readonly Quest[]>>;
    }): void => {
      guildListProxy.setupDirectListing({ items: guilds });
      Object.entries(questsByGuildId).forEach(([guildId, quests]) => {
        questListProxy.setupDirectList({ guildId: GuildIdStub({ value: guildId }), quests });
      });
    },
  };
};
