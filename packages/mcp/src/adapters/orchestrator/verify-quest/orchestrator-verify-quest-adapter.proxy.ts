/**
 * PURPOSE: Proxy for orchestrator-verify-quest-adapter that mocks the orchestrator package
 *
 * USAGE:
 * const proxy = orchestratorVerifyQuestAdapterProxy();
 * proxy.returns({ result: VerifyQuestResultStub() });
 */

import { StartOrchestrator } from '@dungeonmaster/orchestrator';
import type { VerifyQuestResult } from '@dungeonmaster/orchestrator';

import { VerifyQuestResultStub } from '../../../contracts/verify-quest-result/verify-quest-result.stub';

jest.mock('@dungeonmaster/orchestrator');

export const orchestratorVerifyQuestAdapterProxy = (): {
  returns: (params: { result: VerifyQuestResult }) => void;
  throws: (params: { error: Error }) => void;
} => {
  const mock = jest.mocked(StartOrchestrator.verifyQuest);

  mock.mockResolvedValue(VerifyQuestResultStub());

  return {
    returns: ({ result }: { result: VerifyQuestResult }): void => {
      mock.mockResolvedValueOnce(result);
    },
    throws: ({ error }: { error: Error }): void => {
      mock.mockRejectedValueOnce(error);
    },
  };
};
