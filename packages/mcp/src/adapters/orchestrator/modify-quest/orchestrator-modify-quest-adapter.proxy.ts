/**
 * PURPOSE: Proxy for orchestrator-modify-quest-adapter that mocks the orchestrator package
 *
 * USAGE:
 * const proxy = orchestratorModifyQuestAdapterProxy();
 * proxy.returns({ questId: 'add-auth', result: ModifyQuestResultStub() });
 * proxy.getLastCalledInputFor({ questId: 'add-auth' });
 */

import { StartOrchestrator } from '@dungeonmaster/orchestrator';
import type { ModifyQuestResult } from '@dungeonmaster/orchestrator';
import { registerMock } from '@dungeonmaster/testing/register-mock';

// questId is optional: a caller that only cares that the call resolves (it never reads the
// result, e.g. InteractionHandleResponderProxy's get-agent-prompt work-item stamp) and doesn't
// know the address ahead of time can omit it, which falls back to calledWith([]) — a real
// wildcard, staged explicitly by whichever proxy calls it, not a hidden default.
export const orchestratorModifyQuestAdapterProxy = (): {
  returns: (params: { questId?: string; result: ModifyQuestResult }) => void;
  throws: (params: { questId?: string; error: Error }) => void;
  getLastCalledInputFor: (params: { questId: string }) => unknown;
} => {
  const handle = registerMock({ fn: StartOrchestrator.modifyQuest });

  return {
    returns: ({ questId, result }: { questId?: string; result: ModifyQuestResult }): void => {
      handle.calledWith(questId === undefined ? [] : [{ questId }]).resolves(result);
    },
    throws: ({ questId, error }: { questId?: string; error: Error }): void => {
      handle.calledWith(questId === undefined ? [] : [{ questId }]).rejects(error);
    },
    getLastCalledInputFor: ({ questId }: { questId: string }): unknown => {
      const calls = handle.callsMatching([{ questId }]);
      const lastCall = calls.at(-1);
      const firstArg = lastCall?.[0] as { input?: unknown } | undefined;
      return firstArg?.input;
    },
  };
};
