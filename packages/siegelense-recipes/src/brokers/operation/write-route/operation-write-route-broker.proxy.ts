import { StartOrchestrator } from '@dungeonmaster/orchestrator';
import { registerMock, registerSpyOn } from '@dungeonmaster/testing/register-mock';

import { questFolderPathResolveBrokerProxy } from '../../quest/folder-path-resolve/quest-folder-path-resolve-broker.proxy';
import { questPersistDirectBrokerProxy } from '../../quest/persist-direct/quest-persist-direct-broker.proxy';
import type {
  GuildListItemStub,
  OperationItemIdStub,
  QuestStub,
} from '@dungeonmaster/shared/contracts';

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
  const getQuestHandle = registerMock({ fn: StartOrchestrator.getQuest });
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
      getQuestHandle.calledWith([{ questId: quest.id }]).resolves({ success: true, quest });
      findGuildProxy.succeeds({ guild, quest });
      persistProxy.succeeds({ questFilePath, outboxPath });
      registerSpyOn({ object: crypto, method: 'randomUUID' })
        .calledWith([])
        .returns(mintedId as never);
    },
  };
};
