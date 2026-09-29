import { questGetBrokerProxy } from '@dungeonmaster/orchestrator/brokers/quest/get/quest-get-broker.proxy';
import { randomUUID } from '#gateway/node/crypto';
import { registerMock } from '@dungeonmaster/testing/register-mock';

import { questFolderPathResolveBrokerProxy } from '../../quest/folder-path-resolve/quest-folder-path-resolve-broker.proxy';
import { questPersistDirectBrokerProxy } from '../../quest/persist-direct/quest-persist-direct-broker.proxy';
import type { GuildListItemStub } from '@dungeonmaster/shared/contracts/guild-list-item/guild-list-item.stub';
import type { OperationItemIdStub } from '@dungeonmaster/shared/contracts/operation-item-id/operation-item-id.stub';
import type { QuestStub } from '@dungeonmaster/shared/contracts/quest/quest.stub';

type Quest = ReturnType<typeof QuestStub>;
type GuildListItem = ReturnType<typeof GuildListItemStub>;
type OperationItemId = ReturnType<typeof OperationItemIdStub>;

export const operationWriteRouteBrokerProxy = (): {
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
    mintedId: OperationItemId;
  }) => void;
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
      mintedId: OperationItemId;
    }): void => {
      getProxy.setupQuestFound({ quest });
      findGuildProxy.succeeds({ guild, quest });
      persistProxy.succeeds({ questFilePath, outboxPath });
      registerMock({ fn: randomUUID }).calledWith([]).returns(mintedId);
    },
  };
};
