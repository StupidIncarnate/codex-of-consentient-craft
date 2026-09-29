import { dmHttpRequestBrokerProxy } from '../../dm/http-request/dm-http-request-broker.proxy';
import { questReachRouteBrokerProxy } from '../reach-route/quest-reach-route-broker.proxy';
import type { DmHttpResponseStub } from '../../../contracts/dm-http-response/dm-http-response.stub';
import type { GetQuestInputStub } from '@dungeonmaster/shared/contracts/get-quest-input/get-quest-input.stub';
import type { GetQuestResultStub } from '@dungeonmaster/shared/contracts/get-quest-result/get-quest-result.stub';
import type { ModifyQuestInputStub } from '@dungeonmaster/shared/contracts/modify-quest-input/modify-quest-input.stub';
import type { ModifyQuestResultStub } from '@dungeonmaster/shared/contracts/modify-quest-result/modify-quest-result.stub';

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
  const httpProxy = dmHttpRequestBrokerProxy();
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
