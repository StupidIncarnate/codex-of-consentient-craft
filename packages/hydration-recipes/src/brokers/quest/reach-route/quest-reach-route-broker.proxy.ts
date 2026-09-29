import { questGetBrokerProxy, questModifyBrokerProxy } from '@dungeonmaster/orchestrator/testing';

import { dmHttpRequestBrokerProxy } from '../../dm/http-request/dm-http-request-broker.proxy';
import type { DmHttpResponseStub } from '../../../contracts/dm-http-response/dm-http-response.stub';
import type { GetQuestInputStub } from '@dungeonmaster/shared/contracts/get-quest-input/get-quest-input.stub';
import type { GetQuestResultStub } from '@dungeonmaster/shared/contracts/get-quest-result/get-quest-result.stub';
import type { ModifyQuestInputStub } from '@dungeonmaster/shared/contracts/modify-quest-input/modify-quest-input.stub';
import type { ModifyQuestResultStub } from '@dungeonmaster/shared/contracts/modify-quest-result/modify-quest-result.stub';

type ModifyQuestInput = ReturnType<typeof ModifyQuestInputStub>;
type ModifyQuestResult = ReturnType<typeof ModifyQuestResultStub>;
type GetQuestInput = ReturnType<typeof GetQuestInputStub>;
type GetQuestResult = ReturnType<typeof GetQuestResultStub>;
type DmHttpResponse = ReturnType<typeof DmHttpResponseStub>;

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
  // The `input` of every questModifyBroker call the walk made, staged or not.
  getModifyInputs: () => readonly unknown[];
} => {
  // Each hop's answer is keyed by its own `input`, so successive hops don't overwrite each other.
  const getProxy = questGetBrokerProxy();
  const modifyProxy = questModifyBrokerProxy();
  const httpProxy = dmHttpRequestBrokerProxy();

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
    getModifyInputs: (): readonly unknown[] => modifyProxy.getCallInputs(),
  };
};
