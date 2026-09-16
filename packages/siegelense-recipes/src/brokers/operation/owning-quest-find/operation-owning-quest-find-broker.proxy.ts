import {
  guildListBroker,
  questGetBroker,
  questListBroker,
} from '@dungeonmaster/orchestrator/brokers';
import {
  guildListBrokerProxy,
  questGetBrokerProxy,
  questListBrokerProxy,
} from '@dungeonmaster/orchestrator/testing';
import { getQuestInputContract } from '@dungeonmaster/shared/contracts';
import { registerMock } from '@dungeonmaster/testing/register-mock';

import type { GuildListItemStub, QuestStub } from '@dungeonmaster/shared/contracts';

type GuildListItem = ReturnType<typeof GuildListItemStub>;
type Quest = ReturnType<typeof QuestStub>;

export const operationOwningQuestFindBrokerProxy = (): {
  succeeds: ({ guild, quests }: { guild: GuildListItem; quests: readonly Quest[] }) => void;
} => {
  // Each orchestrator proxy's own setup either answers only ONCE (guildList/questList) or drives
  // a full fs-lookup simulation (questGet) rather than letting a test stage an arbitrary,
  // repeatable answer — created here only to satisfy `enforce-proxy-child-creation`; this
  // broker's own registerMock below stages the real, sticky answers.
  guildListBrokerProxy();
  questListBrokerProxy();
  questGetBrokerProxy();
  const listGuildsHandle = registerMock({ fn: guildListBroker });
  const listQuestsHandle = registerMock({ fn: questListBroker });
  const getQuestHandle = registerMock({ fn: questGetBroker });

  return {
    succeeds: ({ guild, quests }: { guild: GuildListItem; quests: readonly Quest[] }): void => {
      listGuildsHandle.calledWith([]).resolves([guild]);
      listQuestsHandle.calledWith([{ guildId: guild.id }]).resolves(quests);
      quests.forEach((quest) => {
        getQuestHandle
          .calledWith([{ input: getQuestInputContract.parse({ questId: quest.id }) }])
          .resolves({ success: true, quest });
      });
    },
  };
};
