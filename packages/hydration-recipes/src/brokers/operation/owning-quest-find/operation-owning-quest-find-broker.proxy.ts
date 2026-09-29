import {
  guildListBrokerProxy,
  questGetBrokerProxy,
  questListBrokerProxy,
} from '@dungeonmaster/orchestrator/testing';
import { GuildIdStub } from '@dungeonmaster/shared/contracts/guild-id/guild-id.stub';

import type { GuildListItemStub } from '@dungeonmaster/shared/contracts/guild-list-item/guild-list-item.stub';
import type { QuestStub } from '@dungeonmaster/shared/contracts/quest/quest.stub';

type GuildListItem = ReturnType<typeof GuildListItemStub>;
type Quest = ReturnType<typeof QuestStub>;

export const operationOwningQuestFindBrokerProxy = (): {
  succeeds: ({ guild, quests }: { guild: GuildListItem; quests: readonly Quest[] }) => void;
} => {
  const guildListProxy = guildListBrokerProxy();
  const questListProxy = questListBrokerProxy();
  const questGetProxy = questGetBrokerProxy();

  return {
    succeeds: ({ guild, quests }: { guild: GuildListItem; quests: readonly Quest[] }): void => {
      guildListProxy.setupDirectListing({ items: [guild] });
      questListProxy.setupDirectList({ guildId: GuildIdStub({ value: guild.id }), quests });
      quests.forEach((quest) => {
        questGetProxy.setupQuestFound({ quest });
      });
    },
  };
};
