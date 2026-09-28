import { questGetBrokerProxy } from '@dungeonmaster/orchestrator/testing';
import { registerSpyOn } from '@dungeonmaster/testing/register-mock';

import { questFolderPathResolveBrokerProxy } from '../folder-path-resolve/quest-folder-path-resolve-broker.proxy';
import { questPersistDirectBrokerProxy } from '../persist-direct/quest-persist-direct-broker.proxy';
import type {
  GuildListItemStub,
  QuestStub,
  QuestWorkItemIdStub,
} from '@dungeonmaster/shared/contracts';

type Quest = ReturnType<typeof QuestStub>;
type GuildListItem = ReturnType<typeof GuildListItemStub>;
type QuestWorkItemId = ReturnType<typeof QuestWorkItemIdStub>;

export const questWorkItemAttachBrokerProxy = (): {
  succeeds: ({
    quest,
    guild,
    questFilePath,
    outboxPath,
    mintedId,
  }: {
    quest: Quest;
    guild: GuildListItem;
    questFilePath: string;
    outboxPath: string;
    mintedId: QuestWorkItemId;
  }) => void;
  setupQuestNotFound: () => void;
  getWrittenContents: ({ questFilePath }: { questFilePath: string }) => unknown;
} => {
  const getProxy = questGetBrokerProxy();
  const findGuildProxy = questFolderPathResolveBrokerProxy();
  const persistProxy = questPersistDirectBrokerProxy();

  return {
    succeeds: ({
      quest,
      guild,
      questFilePath,
      outboxPath,
      mintedId,
    }: {
      quest: Quest;
      guild: GuildListItem;
      questFilePath: string;
      outboxPath: string;
      mintedId: QuestWorkItemId;
    }): void => {
      getProxy.setupQuestFound({ quest });
      findGuildProxy.succeeds({ guild, quest });
      persistProxy.succeeds({ questFilePath, outboxPath });
      registerSpyOn({ object: crypto, method: 'randomUUID' })
        .calledWith([])
        .returns(mintedId as never);
    },
    setupQuestNotFound: (): void => {
      getProxy.setupEmptyFolder();
    },
    getWrittenContents: ({ questFilePath }: { questFilePath: string }): unknown =>
      persistProxy.getWrittenContents({ questFilePath }),
  };
};
