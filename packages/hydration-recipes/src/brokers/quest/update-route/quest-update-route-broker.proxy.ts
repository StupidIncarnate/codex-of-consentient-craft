import { questGetBrokerProxy } from '@dungeonmaster/orchestrator/brokers/quest/get/quest-get-broker.proxy';
import { questModifyBrokerProxy } from '@dungeonmaster/orchestrator/brokers/quest/modify/quest-modify-broker.proxy';

import type { GetQuestInputStub } from '@dungeonmaster/shared/contracts/get-quest-input/get-quest-input.stub';
import type { GetQuestResultStub } from '@dungeonmaster/shared/contracts/get-quest-result/get-quest-result.stub';
import type { ModifyQuestInputStub } from '@dungeonmaster/shared/contracts/modify-quest-input/modify-quest-input.stub';
import type { ModifyQuestResultStub } from '@dungeonmaster/shared/contracts/modify-quest-result/modify-quest-result.stub';

type ModifyQuestInput = ReturnType<typeof ModifyQuestInputStub>;
type ModifyQuestResult = ReturnType<typeof ModifyQuestResultStub>;
type GetQuestInput = ReturnType<typeof GetQuestInputStub>;
type GetQuestResult = ReturnType<typeof GetQuestResultStub>;

export const questUpdateRouteBrokerProxy = (): {
  setupModifyFails: ({
    input,
    result,
  }: {
    input: ModifyQuestInput;
    result: ModifyQuestResult;
  }) => void;
  setupModifySucceeds: ({
    input,
    modifyResult,
    getInput,
    getResult,
  }: {
    input: ModifyQuestInput;
    modifyResult: ModifyQuestResult;
    getInput: GetQuestInput;
    getResult: GetQuestResult;
  }) => void;
} => {
  // Keyed by `input`, so a modify-then-reload sequence doesn't overwrite itself.
  const getProxy = questGetBrokerProxy();
  const modifyProxy = questModifyBrokerProxy();

  return {
    setupModifyFails: ({ input, result }): void => {
      modifyProxy.setupResolves({ input, result });
    },
    setupModifySucceeds: ({ input, modifyResult, getInput, getResult }): void => {
      modifyProxy.setupResolves({ input, result: modifyResult });
      getProxy.setupResolves({ input: getInput, result: getResult });
    },
  };
};
