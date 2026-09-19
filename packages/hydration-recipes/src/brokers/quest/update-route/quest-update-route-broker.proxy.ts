import { questGetBroker, questModifyBroker } from '@dungeonmaster/orchestrator/brokers';
import { questGetBrokerProxy, questModifyBrokerProxy } from '@dungeonmaster/orchestrator/testing';
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
  // questGetBrokerProxy/questModifyBrokerProxy's own setup drives a full fs-lookup simulation
  // rather than letting a test stage a specific result per `input` — created here only to
  // satisfy `enforce-proxy-child-creation`; this route's own registerMock below stages the real
  // answer, keyed by `input` so a modify-then-reload sequence doesn't overwrite itself.
  questGetBrokerProxy();
  questModifyBrokerProxy();
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
