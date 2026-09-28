/**
 * PURPOSE: Test proxy for questOwningGuildFindBroker — mocks the two cross-package orchestrator
 * brokers it composes (`guildListBroker`, `questListBroker`) directly, the same shape
 * `@dungeonmaster/hydration-recipes`' own `questOwningGuildFindBrokerProxy` uses for its byte-for-byte
 * twin.
 *
 * USAGE:
 * const proxy = questOwningGuildFindBrokerProxy();
 * proxy.succeeds({ guilds, questsByGuildId });
 */
import { guildListBroker, questListBroker } from '@dungeonmaster/orchestrator/brokers';
import { guildListBrokerProxy, questListBrokerProxy } from '@dungeonmaster/orchestrator/testing';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import type { GuildListItemStub, QuestStub } from '@dungeonmaster/shared/contracts';

type GuildListItem = ReturnType<typeof GuildListItemStub>;
type Quest = ReturnType<typeof QuestStub>;

export const questOwningGuildFindBrokerProxy = (): {
  succeeds: (params: {
    guilds: readonly GuildListItem[];
    questsByGuildId: Readonly<Record<string, readonly Quest[]>>;
  }) => void;
} => {
  // guildListBrokerProxy/questListBrokerProxy's own setup answers only ONE call each — created here
  // only to satisfy `enforce-proxy-child-creation`; this broker's own registerMock below answers
  // EVERY call, sticky, which every caller composing this proxy relies on.
  guildListBrokerProxy();
  questListBrokerProxy();
  const listGuildsHandle = registerMock({ fn: guildListBroker });
  const listQuestsHandle = registerMock({ fn: questListBroker });

  return {
    succeeds: ({
      guilds,
      questsByGuildId,
    }: {
      guilds: readonly GuildListItem[];
      questsByGuildId: Readonly<Record<string, readonly Quest[]>>;
    }): void => {
      listGuildsHandle.calledWith([]).resolves(guilds);
      Object.entries(questsByGuildId).forEach(([guildId, quests]) => {
        listQuestsHandle.calledWith([{ guildId }]).resolves(quests);
      });
    },
  };
};
