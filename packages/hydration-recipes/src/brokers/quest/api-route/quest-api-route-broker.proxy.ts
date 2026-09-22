import { dmHttpRequestAdapterProxy } from '../../../adapters/dm-http/request/dm-http-request-adapter.proxy';
import { dmHttpResponseUnwrapAdapterProxy } from '../../../adapters/dm-http/response-unwrap/dm-http-response-unwrap-adapter.proxy';
import { questReachRouteBrokerProxy } from '../reach-route/quest-reach-route-broker.proxy';
import type { DmHttpResponseStub } from '../../../contracts/dm-http-response/dm-http-response.stub';
import type {
  GetQuestInputStub,
  GetQuestResultStub,
  ModifyQuestInputStub,
  ModifyQuestResultStub,
} from '@dungeonmaster/shared/contracts';

type DmHttpResponse = ReturnType<typeof DmHttpResponseStub>;
type ModifyQuestInput = ReturnType<typeof ModifyQuestInputStub>;
type ModifyQuestResult = ReturnType<typeof ModifyQuestResultStub>;
type GetQuestInput = ReturnType<typeof GetQuestInputStub>;
type GetQuestResult = ReturnType<typeof GetQuestResultStub>;

export const questApiRouteBrokerProxy = (): {
  succeeds: ({ url, response }: { url: string; response: DmHttpResponse }) => void;
  succeedsWalkHop: ({
    input,
    result,
  }: {
    input: ModifyQuestInput;
    result: ModifyQuestResult;
  }) => void;
  succeedsWalkReload: ({ input, result }: { input: GetQuestInput; result: GetQuestResult }) => void;
} => {
  const httpProxy = dmHttpRequestAdapterProxy();
  dmHttpResponseUnwrapAdapterProxy();
  // questApiRouteBroker delegates a status walk to the REAL questReachRouteBroker (Proxy
  // Encapsulation Rule — a broker calling a broker runs real, mocked only at its own I/O
  // boundary), so this composes that broker's own proxy rather than re-mocking
  // questModifyBroker/questGetBroker a second time here.
  const reachProxy = questReachRouteBrokerProxy();

  return {
    succeeds: ({ url, response }: { url: string; response: DmHttpResponse }): void => {
      httpProxy.succeeds({ url, response });
    },
    succeedsWalkHop: ({
      input,
      result,
    }: {
      input: ModifyQuestInput;
      result: ModifyQuestResult;
    }): void => {
      reachProxy.setupModifyHop({ input, result });
    },
    succeedsWalkReload: ({
      input,
      result,
    }: {
      input: GetQuestInput;
      result: GetQuestResult;
    }): void => {
      reachProxy.setupReload({ input, result });
    },
  };
};
