/**
 * PURPOSE: Proxy for orchestrator-get-quest-adapter that mocks the orchestrator package
 *
 * USAGE:
 * const proxy = orchestratorGetQuestAdapterProxy();
 * proxy.returns({ questId: 'add-auth', result: GetQuestResultStub() });
 */

import { StartOrchestrator } from '@dungeonmaster/orchestrator';
import type { GetQuestResult } from '@dungeonmaster/orchestrator';
import { registerMock } from '@dungeonmaster/testing/register-mock';

export const orchestratorGetQuestAdapterProxy = (): {
  returns: (params: { questId: string; result: GetQuestResult }) => void;
  throws: (params: { questId: string; error: Error }) => void;
} => {
  const handle = registerMock({ fn: StartOrchestrator.getQuest });

  return {
    returns: ({ questId, result }: { questId: string; result: GetQuestResult }): void => {
      handle.calledWith([{ questId }]).resolves(result);
    },
    throws: ({ questId, error }: { questId: string; error: Error }): void => {
      handle.calledWith([{ questId }]).rejects(error);
    },
  };
};
