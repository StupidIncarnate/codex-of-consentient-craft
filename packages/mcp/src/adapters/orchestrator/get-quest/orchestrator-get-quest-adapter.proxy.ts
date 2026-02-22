/**
 * PURPOSE: Proxy for orchestrator-get-quest-adapter that mocks the orchestrator package
 *
 * USAGE:
 * const proxy = orchestratorGetQuestAdapterProxy();
 * proxy.returns({ result: GetQuestResultStub() });
 */

import { StartOrchestrator } from '@dungeonmaster/orchestrator';
import type { GetQuestResult } from '@dungeonmaster/orchestrator';

import { GetQuestResultStub } from '../../../contracts/get-quest-result/get-quest-result.stub';

jest.mock('@dungeonmaster/orchestrator');

export const orchestratorGetQuestAdapterProxy = (): {
  returns: (params: { result: GetQuestResult }) => void;
  throws: (params: { error: Error }) => void;
} => {
  const mock = jest.mocked(StartOrchestrator.getQuest);

  mock.mockResolvedValue(GetQuestResultStub());

  return {
    returns: ({ result }: { result: GetQuestResult }): void => {
      mock.mockResolvedValueOnce(result);
    },
    throws: ({ error }: { error: Error }): void => {
      mock.mockRejectedValueOnce(error);
    },
  };
};
