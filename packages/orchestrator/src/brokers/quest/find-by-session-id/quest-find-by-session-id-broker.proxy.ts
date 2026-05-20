import type { GuildListItem, QuestStub } from '@dungeonmaster/shared/contracts';
import { registerModuleMock, requireActual } from '@dungeonmaster/testing/register-mock';

import { guildListBrokerProxy } from '../../guild/list/guild-list-broker.proxy';
import { questListBrokerProxy } from '../list/quest-list-broker.proxy';
import { questFindBySessionIdBroker } from './quest-find-by-session-id-broker';

registerModuleMock({ module: './quest-find-by-session-id-broker' });

type Quest = ReturnType<typeof QuestStub>;

export const questFindBySessionIdBrokerProxy = (): {
  setupGuildsAndQuests: (params: {
    guildItems: readonly GuildListItem[];
    questsByGuildId: readonly { guildId: GuildListItem['id']; quests: readonly Quest[] }[];
  }) => void;
  setupNoGuilds: () => void;
} => {
  const guildListProxy = guildListBrokerProxy();
  const questListProxy = questListBrokerProxy();

  const mocked = questFindBySessionIdBroker as jest.MockedFunction<
    typeof questFindBySessionIdBroker
  >;
  const realMod = requireActual<{
    questFindBySessionIdBroker: typeof questFindBySessionIdBroker;
  }>({ module: './quest-find-by-session-id-broker' });
  mocked.mockImplementation(realMod.questFindBySessionIdBroker);

  return {
    setupGuildsAndQuests: ({
      guildItems,
      questsByGuildId,
    }: {
      guildItems: readonly GuildListItem[];
      questsByGuildId: readonly { guildId: GuildListItem['id']; quests: readonly Quest[] }[];
    }): void => {
      guildListProxy.setupDirectListing({ items: guildItems });
      for (const { guildId, quests } of questsByGuildId) {
        questListProxy.setupDirectList({ guildId, quests });
      }
    },
    setupNoGuilds: (): void => {
      guildListProxy.setupDirectListing({ items: [] });
    },
  };
};
