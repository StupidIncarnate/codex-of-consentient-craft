import { operationOwningQuestFindBrokerProxy } from '../owning-quest-find/operation-owning-quest-find-broker.proxy';
import { questFolderPathResolveBrokerProxy } from '../../quest/folder-path-resolve/quest-folder-path-resolve-broker.proxy';
import { questPersistDirectBrokerProxy } from '../../quest/persist-direct/quest-persist-direct-broker.proxy';
import type { GuildListItemStub, QuestStub } from '@dungeonmaster/shared/contracts';

type Quest = ReturnType<typeof QuestStub>;
type GuildListItem = ReturnType<typeof GuildListItemStub>;

export const operationRemoveRouteBrokerProxy = (): {
  succeeds: ({
    guild,
    quest,
    questFilePath,
    outboxPath,
  }: {
    guild: GuildListItem;
    quest: Quest;
    questFilePath: string;
    outboxPath: string;
  }) => void;
  getWrittenQuest: ({ questFilePath }: { questFilePath: string }) => unknown;
} => {
  const findQuestProxy = operationOwningQuestFindBrokerProxy();
  const findGuildProxy = questFolderPathResolveBrokerProxy();
  const persistProxy = questPersistDirectBrokerProxy();

  return {
    succeeds: ({
      guild,
      quest,
      questFilePath,
      outboxPath,
    }: {
      guild: GuildListItem;
      quest: Quest;
      questFilePath: string;
      outboxPath: string;
    }): void => {
      findQuestProxy.succeeds({ guild, quests: [quest] });
      findGuildProxy.succeeds({ guild, quest });
      persistProxy.succeeds({ questFilePath, outboxPath });
    },
    getWrittenQuest: ({ questFilePath }: { questFilePath: string }): unknown =>
      persistProxy.getWrittenContents({ questFilePath }),
  };
};
