import { questGetBroker, questModifyBroker } from '@dungeonmaster/orchestrator/brokers';
import { questGetBrokerProxy, questModifyBrokerProxy } from '@dungeonmaster/orchestrator/testing';
import { registerMock } from '@dungeonmaster/testing/register-mock';

import { dmHttpRequestAdapterProxy } from '../../../adapters/dm-http/request/dm-http-request-adapter.proxy';
import { dmHttpResponseUnwrapAdapterProxy } from '../../../adapters/dm-http/response-unwrap/dm-http-response-unwrap-adapter.proxy';
import type { DmHttpResponseStub } from '../../../contracts/dm-http-response/dm-http-response.stub';
import { questFolderPathResolveBrokerProxy } from '../folder-path-resolve/quest-folder-path-resolve-broker.proxy';
import { questPersistDirectBrokerProxy } from '../persist-direct/quest-persist-direct-broker.proxy';
import type {
  GetQuestInputStub,
  GetQuestResultStub,
  GuildListItemStub,
  ModifyQuestInputStub,
  ModifyQuestResultStub,
  QuestStub,
} from '@dungeonmaster/shared/contracts';

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
} => {
  // questGetBrokerProxy/questModifyBrokerProxy's own setup drives a full fs-lookup simulation
  // rather than letting a test stage a different result per HOP — created here only to satisfy
  // `enforce-proxy-child-creation`; this route's own registerMock below stages each hop's answer,
  // keyed by its own `input` so successive hops don't overwrite each other.
  questGetBrokerProxy();
  questModifyBrokerProxy();
  const modifyHandle = registerMock({ fn: questModifyBroker });
  const getHandle = registerMock({ fn: questGetBroker });
  const httpProxy = dmHttpRequestAdapterProxy();
  dmHttpResponseUnwrapAdapterProxy();
  const folderProxy = questFolderPathResolveBrokerProxy();
  const persistProxy = questPersistDirectBrokerProxy();

  return {
    setupModifyHop: ({ input, result }): void => {
      modifyHandle.calledWith([{ input }]).resolves(result);
    },
    setupStart: ({ url, response }): void => {
      httpProxy.succeeds({ url, response });
    },
    setupReload: ({ input, result }): void => {
      getHandle.calledWith([{ input }]).resolves(result);
    },
    // The reload right after START and the final reload share one address, so a test that needs
    // the two to answer differently stages the first with this, then the second with setupReload.
    setupReloadOnce: ({ input, result }): void => {
      getHandle.onceFor([{ input }]).resolves(result);
    },
    setupPersist: ({ guild, quest, questFilePath, outboxPath }): void => {
      folderProxy.succeeds({ guild, quest });
      persistProxy.succeeds({ questFilePath, outboxPath });
    },
    getWrittenQuest: ({ questFilePath }): unknown =>
      persistProxy.getWrittenContents({ questFilePath }),
    pathsTouched: (): readonly unknown[] => persistProxy.pathsTouched(),
  };
};
