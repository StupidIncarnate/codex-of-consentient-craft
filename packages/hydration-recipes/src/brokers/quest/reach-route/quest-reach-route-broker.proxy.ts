import { questGetBrokerProxy } from '@dungeonmaster/orchestrator/brokers/quest/get/quest-get-broker.proxy';
import { questModifyBrokerProxy } from '@dungeonmaster/orchestrator/brokers/quest/modify/quest-modify-broker.proxy';

import { dmHttpRequestBrokerProxy } from '../../dm/http-request/dm-http-request-broker.proxy';
import type { DmHttpResponseStub } from '../../../contracts/dm-http-response/dm-http-response.stub';
import type { GetQuestInputStub } from '@dungeonmaster/shared/contracts/get-quest-input/get-quest-input.stub';
import type { GetQuestResultStub } from '@dungeonmaster/shared/contracts/get-quest-result/get-quest-result.stub';
import type { ModifyQuestInputStub } from '@dungeonmaster/shared/contracts/modify-quest-input/modify-quest-input.stub';
import type { ModifyQuestResultStub } from '@dungeonmaster/shared/contracts/modify-quest-result/modify-quest-result.stub';
import { questFolderPathResolveBrokerProxy } from '../folder-path-resolve/quest-folder-path-resolve-broker.proxy';
import { questPersistDirectBrokerProxy } from '../persist-direct/quest-persist-direct-broker.proxy';
import type { GuildListItemStub } from '@dungeonmaster/shared/contracts/guild-list-item/guild-list-item.stub';
import type { QuestStub } from '@dungeonmaster/shared/contracts/quest/quest.stub';

type ModifyQuestInput = ReturnType<typeof ModifyQuestInputStub>;
type ModifyQuestResult = ReturnType<typeof ModifyQuestResultStub>;
type GetQuestInput = ReturnType<typeof GetQuestInputStub>;
type GetQuestResult = ReturnType<typeof GetQuestResultStub>;
type DmHttpResponse = ReturnType<typeof DmHttpResponseStub>;
type GuildListItem = ReturnType<typeof GuildListItemStub>;
type Quest = ReturnType<typeof QuestStub>;

export const questReachRouteBrokerProxy = (): {
  setupModifyHop: ({
    input,
    result,
  }: {
    input: ModifyQuestInput;
    result: ModifyQuestResult;
  }) => void;
  setupStart: ({ url, response }: { url: string; response: DmHttpResponse }) => void;
  setupReload: ({ input, result }: { input: GetQuestInput; result: GetQuestResult }) => void;
  setupReloadOnce: ({ input, result }: { input: GetQuestInput; result: GetQuestResult }) => void;
  setupPersist: ({
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
  pathsTouched: () => readonly unknown[];
  // The `input` of every questModifyBroker call the walk made, staged or not.
  getModifyInputs: () => readonly unknown[];
} => {
  // Each hop's answer is keyed by its own `input`, so successive hops don't overwrite each other.
  const getProxy = questGetBrokerProxy();
  const modifyProxy = questModifyBrokerProxy();
  const httpProxy = dmHttpRequestBrokerProxy();
  const folderProxy = questFolderPathResolveBrokerProxy();
  const persistProxy = questPersistDirectBrokerProxy();

  return {
    setupModifyHop: ({ input, result }): void => {
      modifyProxy.setupResolves({ input, result });
    },
    setupStart: ({ url, response }): void => {
      httpProxy.succeeds({ url, response });
    },
    setupReload: ({ input, result }): void => {
      getProxy.setupResolves({ input, result });
    },
    // The reload right after START and the final reload share one address, so a test that needs
    // the two to answer differently stages the first with this, then the second with setupReload.
    setupReloadOnce: ({ input, result }): void => {
      getProxy.setupResolvesOnce({ input, result });
    },
    setupPersist: ({ guild, quest, questFilePath, outboxPath }): void => {
      folderProxy.succeeds({ guild, quest });
      persistProxy.succeeds({ questFilePath, outboxPath });
    },
    getWrittenQuest: ({ questFilePath }): unknown =>
      persistProxy.getWrittenContents({ questFilePath }),
    pathsTouched: (): readonly unknown[] => persistProxy.pathsTouched(),
    getModifyInputs: (): readonly unknown[] => modifyProxy.getCallInputs(),
  };
};
