import type { GuildListItem, QuestStub } from '@dungeonmaster/shared/contracts';
import { questContract } from '@dungeonmaster/shared/contracts';
import { registerModuleMock, requireActual } from '@dungeonmaster/testing/register-mock';

import { guildListBrokerProxy } from '../../guild/list/guild-list-broker.proxy';
import { questListBrokerProxy } from '../list/quest-list-broker.proxy';
import { questModifyBrokerProxy } from '../modify/quest-modify-broker.proxy';
import { questOrphanResetBroker } from './quest-orphan-reset-broker';

registerModuleMock({ module: './quest-orphan-reset-broker' });

type Quest = ReturnType<typeof QuestStub>;

export const questOrphanResetBrokerProxy = (): {
  setupGuildsAndQuests: (params: {
    guildItems: readonly GuildListItem[];
    questsByGuildId: readonly { guildId: GuildListItem['id']; quests: readonly Quest[] }[];
  }) => void;
  setupModifyForQuest: (params: { quest: Quest }) => void;
  getAllPersistedContents: () => readonly unknown[];
  getLastPersistedQuest: () => Quest;
} => {
  const guildListProxy = guildListBrokerProxy();
  const questListProxy = questListBrokerProxy();
  const modifyProxy = questModifyBrokerProxy();

  const mocked = questOrphanResetBroker as jest.MockedFunction<typeof questOrphanResetBroker>;
  const realMod = requireActual<{ questOrphanResetBroker: typeof questOrphanResetBroker }>({
    module: './quest-orphan-reset-broker',
  });
  mocked.mockImplementation(realMod.questOrphanResetBroker);

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
    setupModifyForQuest: ({ quest }: { quest: Quest }): void => {
      modifyProxy.setupQuestFound({ quest });
    },
    getAllPersistedContents: (): readonly unknown[] => modifyProxy.getAllPersistedContents(),
    getLastPersistedQuest: (): Quest => {
      const persisted = modifyProxy.getAllPersistedContents();
      const last = persisted[persisted.length - 1];
      return questContract.parse(JSON.parse(String(last)));
    },
  };
};
