/**
 * PURPOSE: Proxy for orchestrator-get-quest-adapter that mocks the orchestrator package
 *
 * USAGE:
 * const proxy = orchestratorGetQuestAdapterProxy();
 * proxy.returns({ result: GetQuestResultStub() });
 */

import { StartOrchestrator } from '@dungeonmaster/orchestrator';
import type { GetQuestResult } from '@dungeonmaster/orchestrator';
import { registerMock } from '@dungeonmaster/testing/register-mock';

import { GetQuestResultStub } from '../../../contracts/get-quest-result/get-quest-result.stub';

export const orchestratorGetQuestAdapterProxy = (): {
  returns: (params: { result: GetQuestResult }) => void;
  throws: (params: { error: Error }) => void;
} => {
  const handle = registerMock({ fn: StartOrchestrator.getQuest });

  handle.mockResolvedValue(GetQuestResultStub());

  return {
    returns: ({ result }: { result: GetQuestResult }): void => {
      handle.mockResolvedValueOnce(result);
    },
    throws: ({ error }: { error: Error }): void => {
      handle.mockRejectedValueOnce(error);
    },
  };
};
