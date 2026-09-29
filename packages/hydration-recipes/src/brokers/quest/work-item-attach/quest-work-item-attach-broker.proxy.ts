import { questGetBrokerProxy } from '@dungeonmaster/orchestrator/testing';
import { randomUUID } from '#gateway/node/crypto';
import { registerMock } from '@dungeonmaster/testing/register-mock';

import { questFolderPathResolveBrokerProxy } from '../folder-path-resolve/quest-folder-path-resolve-broker.proxy';
import { questPersistDirectBrokerProxy } from '../persist-direct/quest-persist-direct-broker.proxy';
import type { GuildListItemStub } from '@dungeonmaster/shared/contracts/guild-list-item/guild-list-item.stub';
import type { QuestStub } from '@dungeonmaster/shared/contracts/quest/quest.stub';
import type { QuestWorkItemIdStub } from '@dungeonmaster/shared/contracts/quest-work-item-id/quest-work-item-id.stub';

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
      registerMock({ fn: randomUUID }).calledWith([]).returns(mintedId);
    },
    setupQuestNotFound: (): void => {
      getProxy.setupEmptyFolder();
    },
    getWrittenContents: ({ questFilePath }: { questFilePath: string }): unknown =>
      persistProxy.getWrittenContents({ questFilePath }),
  };
};
