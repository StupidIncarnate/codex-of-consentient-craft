import { questGetBroker, questModifyBroker } from '@dungeonmaster/orchestrator/brokers';
import { questGetBrokerProxy, questModifyBrokerProxy } from '@dungeonmaster/orchestrator/testing';
import { registerMock } from '@dungeonmaster/testing/register-mock';

import { dmHttpRequestAdapterProxy } from '../../../adapters/dm-http/request/dm-http-request-adapter.proxy';
import { dmHttpResponseUnwrapAdapterProxy } from '../../../adapters/dm-http/response-unwrap/dm-http-response-unwrap-adapter.proxy';
import type { DmHttpResponseStub } from '../../../contracts/dm-http-response/dm-http-response.stub';
import type {
  GetQuestInputStub,
  GetQuestResultStub,
  ModifyQuestInputStub,
  ModifyQuestResultStub,
} from '@dungeonmaster/shared/contracts';

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
  };
};
