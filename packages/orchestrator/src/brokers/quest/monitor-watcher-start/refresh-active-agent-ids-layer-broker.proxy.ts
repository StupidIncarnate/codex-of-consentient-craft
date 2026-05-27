import type { GuildListItem, QuestStub } from '@dungeonmaster/shared/contracts';

import { guildListBroker } from '../../guild/list/guild-list-broker';
import { guildListBrokerProxy } from '../../guild/list/guild-list-broker.proxy';
import { questListBroker } from '../list/quest-list-broker';
import { questListBrokerProxy } from '../list/quest-list-broker.proxy';

type Quest = ReturnType<typeof QuestStub>;

export const refreshActiveAgentIdsLayerBrokerProxy = (): {
  setupGuilds: (params: { guilds: readonly GuildListItem[] }) => void;
  setupQuests: (params: { quests: readonly Quest[] }) => void;
} => {
  guildListBrokerProxy();
  questListBrokerProxy();

  return {
    setupGuilds: ({ guilds }: { guilds: readonly GuildListItem[] }): void => {
      (guildListBroker as jest.MockedFunction<typeof guildListBroker>).mockResolvedValue(
        guilds as GuildListItem[],
      );
    },
    setupQuests: ({ quests }: { quests: readonly Quest[] }): void => {
      (questListBroker as jest.MockedFunction<typeof questListBroker>).mockResolvedValue(
        quests as Quest[],
      );
    },
  };
};
