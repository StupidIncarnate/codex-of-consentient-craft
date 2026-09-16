import { questGetBroker, questModifyBroker } from '@dungeonmaster/orchestrator';
import { registerMock } from '@dungeonmaster/testing/register-mock';

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
  const modifyHandle = registerMock({ fn: questModifyBroker });
  const getHandle = registerMock({ fn: questGetBroker });

  return {
    setupModifyFails: ({ input, result }): void => {
      modifyHandle.calledWith([{ input }]).resolves(result);
    },
    setupModifySucceeds: ({ input, modifyResult, getInput, getResult }): void => {
      modifyHandle.calledWith([{ input }]).resolves(modifyResult);
      getHandle.calledWith([{ input: getInput }]).resolves(getResult);
    },
  };
};
