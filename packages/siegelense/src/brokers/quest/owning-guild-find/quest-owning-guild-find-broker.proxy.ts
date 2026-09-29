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
import { guildListBrokerProxy, questListBrokerProxy } from '@dungeonmaster/orchestrator/testing';
import { GuildIdStub } from '@dungeonmaster/shared/contracts';
import type { GuildListItemStub, QuestStub } from '@dungeonmaster/shared/contracts';

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
