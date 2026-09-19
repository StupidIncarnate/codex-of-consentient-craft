import { questDeleteBroker } from '@dungeonmaster/orchestrator/brokers';
import { questDeleteBrokerProxy } from '@dungeonmaster/orchestrator/testing';
import { registerMock } from '@dungeonmaster/testing/register-mock';

import { questOwningGuildFindBrokerProxy } from '../owning-guild-find/quest-owning-guild-find-broker.proxy';
import type { GuildListItemStub, QuestStub } from '@dungeonmaster/shared/contracts';

type GuildListItem = ReturnType<typeof GuildListItemStub>;
type Quest = ReturnType<typeof QuestStub>;

export const questRemoveRouteBrokerProxy = (): {
  succeeds: ({ guild, quest }: { guild: GuildListItem; quest: Quest }) => void;
} => {
  const findGuildProxy = questOwningGuildFindBrokerProxy();
  // questDeleteBrokerProxy's own setup drives a full fs-rm simulation rather than letting a test
  // stage a plain resolved value — created here only to satisfy `enforce-proxy-child-creation`;
  // this route's own registerMock below stages the real answer.
  questDeleteBrokerProxy();
  const deleteQuestHandle = registerMock({ fn: questDeleteBroker });

  return {
    succeeds: ({ guild, quest }: { guild: GuildListItem; quest: Quest }): void => {
      findGuildProxy.succeeds({
        guilds: [guild],
        questsByGuildId: { [guild.id]: [quest] },
      });
      deleteQuestHandle
        .calledWith([{ questId: quest.id, guildId: guild.id }])
        .resolves({ success: true });
    },
  };
};
