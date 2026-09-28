import { questGetBrokerProxy, questModifyBrokerProxy } from '@dungeonmaster/orchestrator/testing';

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
