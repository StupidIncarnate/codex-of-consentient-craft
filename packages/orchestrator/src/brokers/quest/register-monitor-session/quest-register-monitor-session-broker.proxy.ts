import { pathDirnameAdapterProxy } from '@dungeonmaster/shared/testing';
import type { FilePath, GuildListItem, QuestStub } from '@dungeonmaster/shared/contracts';

import { guildListBrokerProxy } from '../../guild/list/guild-list-broker.proxy';
import { questListBrokerProxy } from '../list/quest-list-broker.proxy';
import { questModifyBrokerProxy } from '../modify/quest-modify-broker.proxy';

type Quest = ReturnType<typeof QuestStub>;

export const questRegisterMonitorSessionBrokerProxy = (): {
  setupGuildsAndQuests: (params: {
    guildItems: readonly GuildListItem[];
    questsByGuildId: readonly { guildId: GuildListItem['id']; quests: readonly Quest[] }[];
  }) => void;
  setupQuestModifyForOrphanReset: (params: { quest: Quest }) => void;
  setupProjectDir: (params: { result: FilePath }) => void;
  getAllPersistedContents: () => readonly unknown[];
} => {
  const guildListProxy = guildListBrokerProxy();
  const questListProxy = questListBrokerProxy();
  const modifyProxy = questModifyBrokerProxy();
  const dirnameProxy = pathDirnameAdapterProxy();

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
    setupQuestModifyForOrphanReset: ({ quest }: { quest: Quest }): void => {
      modifyProxy.setupQuestFound({ quest });
    },
    setupProjectDir: ({ result }: { result: FilePath }): void => {
      dirnameProxy.returns({ result });
    },
    getAllPersistedContents: (): readonly unknown[] => modifyProxy.getAllPersistedContents(),
  };
};
