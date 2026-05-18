import type { GuildListItem, QuestStub } from '@dungeonmaster/shared/contracts';
import { registerModuleMock, requireActual } from '@dungeonmaster/testing/register-mock';

import { guildListBrokerProxy } from '../../guild/list/guild-list-broker.proxy';
import { questListBrokerProxy } from '../list/quest-list-broker.proxy';
import { questFindByWorkItemIdBroker } from './quest-find-by-work-item-id-broker';

registerModuleMock({ module: './quest-find-by-work-item-id-broker' });

type Quest = ReturnType<typeof QuestStub>;

export const questFindByWorkItemIdBrokerProxy = (): {
  setupGuildsAndQuests: (params: {
    guildItems: readonly GuildListItem[];
    questsByGuildId: readonly { guildId: GuildListItem['id']; quests: readonly Quest[] }[];
  }) => void;
  setupNoGuilds: () => void;
} => {
  const guildListProxy = guildListBrokerProxy();
  const questListProxy = questListBrokerProxy();

  // The real broker passes through unless overridden by setup methods. Default
  // implementation = real, so caller proxy chains (used by callers that want to mock the
  // broker outright) take precedence via mockResolvedValueOnce / setupNoGuilds.
  const mocked = questFindByWorkItemIdBroker as jest.MockedFunction<
    typeof questFindByWorkItemIdBroker
  >;
  const realMod = requireActual<{
    questFindByWorkItemIdBroker: typeof questFindByWorkItemIdBroker;
  }>({ module: './quest-find-by-work-item-id-broker' });
  mocked.mockImplementation(realMod.questFindByWorkItemIdBroker);

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
