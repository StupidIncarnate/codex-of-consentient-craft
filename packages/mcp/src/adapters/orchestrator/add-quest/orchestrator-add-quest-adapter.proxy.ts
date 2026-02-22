/**
 * PURPOSE: Proxy for orchestrator-add-quest-adapter that mocks the orchestrator package
 *
 * USAGE:
 * const proxy = orchestratorAddQuestAdapterProxy();
 * proxy.returns({ result: AddQuestResultStub() });
 */

import { StartOrchestrator } from '@dungeonmaster/orchestrator';
import type { AddQuestResult } from '@dungeonmaster/orchestrator';

import { AddQuestResultStub } from '../../../contracts/add-quest-result/add-quest-result.stub';

jest.mock('@dungeonmaster/orchestrator');

export const orchestratorAddQuestAdapterProxy = (): {
  returns: (params: { result: AddQuestResult }) => void;
  throws: (params: { error: Error }) => void;
} => {
  const mock = jest.mocked(StartOrchestrator.addQuest);

  mock.mockResolvedValue(AddQuestResultStub());

  return {
    returns: ({ result }: { result: AddQuestResult }): void => {
      mock.mockResolvedValueOnce(result);
    },
    throws: ({ error }: { error: Error }): void => {
      mock.mockRejectedValueOnce(error);
    },
  };
};
