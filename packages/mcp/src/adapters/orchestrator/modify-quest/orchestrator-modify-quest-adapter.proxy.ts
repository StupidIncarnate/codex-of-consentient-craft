/**
 * PURPOSE: Proxy for orchestrator-modify-quest-adapter that mocks the orchestrator package
 *
 * USAGE:
 * const proxy = orchestratorModifyQuestAdapterProxy();
 * proxy.returns({ result: ModifyQuestResultStub() });
 */

import { StartOrchestrator } from '@dungeonmaster/orchestrator';
import type { ModifyQuestResult } from '@dungeonmaster/orchestrator';

import { ModifyQuestResultStub } from '../../../contracts/modify-quest-result/modify-quest-result.stub';

jest.mock('@dungeonmaster/orchestrator');

export const orchestratorModifyQuestAdapterProxy = (): {
  returns: (params: { result: ModifyQuestResult }) => void;
  throws: (params: { error: Error }) => void;
} => {
  const mock = jest.mocked(StartOrchestrator.modifyQuest);

  mock.mockResolvedValue(ModifyQuestResultStub());

  return {
    returns: ({ result }: { result: ModifyQuestResult }): void => {
      mock.mockResolvedValueOnce(result);
    },
    throws: ({ error }: { error: Error }): void => {
      mock.mockRejectedValueOnce(error);
    },
  };
};
