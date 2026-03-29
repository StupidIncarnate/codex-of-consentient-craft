/**
 * PURPOSE: Proxy for orchestrator-modify-quest-adapter that mocks the orchestrator package
 *
 * USAGE:
 * const proxy = orchestratorModifyQuestAdapterProxy();
 * proxy.returns({ result: ModifyQuestResultStub() });
 */

import { StartOrchestrator } from '@dungeonmaster/orchestrator';
import type { ModifyQuestResult } from '@dungeonmaster/orchestrator';
import { registerMock } from '@dungeonmaster/testing/register-mock';

import { ModifyQuestResultStub } from '../../../contracts/modify-quest-result/modify-quest-result.stub';

export const orchestratorModifyQuestAdapterProxy = (): {
  returns: (params: { result: ModifyQuestResult }) => void;
  throws: (params: { error: Error }) => void;
  getLastCalledInput: () => unknown;
} => {
  const handle = registerMock({ fn: StartOrchestrator.modifyQuest });

  handle.mockResolvedValue(ModifyQuestResultStub());

  return {
    returns: ({ result }: { result: ModifyQuestResult }): void => {
      handle.mockResolvedValueOnce(result);
    },
    throws: ({ error }: { error: Error }): void => {
      handle.mockRejectedValueOnce(error);
    },
    getLastCalledInput: (): unknown => {
      const lastCall = handle.mock.calls.at(-1);
      const firstArg = lastCall?.[0] as { input?: unknown } | undefined;
      return firstArg?.input;
    },
  };
};
