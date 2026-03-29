/**
 * PURPOSE: Proxy for orchestrator-verify-quest-adapter that mocks the orchestrator package
 *
 * USAGE:
 * const proxy = orchestratorVerifyQuestAdapterProxy();
 * proxy.returns({ result: VerifyQuestResultStub() });
 */

import { StartOrchestrator } from '@dungeonmaster/orchestrator';
import type { VerifyQuestResult } from '@dungeonmaster/orchestrator';
import { registerMock } from '@dungeonmaster/testing/register-mock';

import { VerifyQuestResultStub } from '../../../contracts/verify-quest-result/verify-quest-result.stub';

export const orchestratorVerifyQuestAdapterProxy = (): {
  returns: (params: { result: VerifyQuestResult }) => void;
  throws: (params: { error: Error }) => void;
} => {
  const handle = registerMock({ fn: StartOrchestrator.verifyQuest });

  handle.mockResolvedValue(VerifyQuestResultStub());

  return {
    returns: ({ result }: { result: VerifyQuestResult }): void => {
      handle.mockResolvedValueOnce(result);
    },
    throws: ({ error }: { error: Error }): void => {
      handle.mockRejectedValueOnce(error);
    },
  };
};
