/**
 * PURPOSE: Proxy for orchestrator-record-quest-session-adapter that mocks the orchestrator package
 *
 * USAGE:
 * const proxy = orchestratorRecordQuestSessionAdapterProxy();
 * proxy.returns({ sessionId: 'abc-123' });
 * proxy.getLastCallFor({ sessionId: 'abc-123' });
 */

import { StartOrchestrator } from '@dungeonmaster/orchestrator';
import { registerMock } from '@dungeonmaster/testing/register-mock';

// `sessionId` is optional so a caller that only needs the call to resolve — the get-agent-prompt
// stamp, which never reads the result and does not know the address ahead of time — can stage a
// real wildcard explicitly rather than inheriting a hidden default.
export const orchestratorRecordQuestSessionAdapterProxy = (): {
  returns: (params: { sessionId?: string }) => void;
  throws: (params: { sessionId?: string; error: Error }) => void;
  getLastCallFor: (params: { sessionId: string }) => unknown;
} => {
  const handle = registerMock({ fn: StartOrchestrator.recordQuestSession });

  return {
    returns: ({ sessionId }: { sessionId?: string }): void => {
      handle
        .calledWith(sessionId === undefined ? [] : [{ sessionId }])
        .resolves({ success: true as const });
    },
    throws: ({ sessionId, error }: { sessionId?: string; error: Error }): void => {
      handle.calledWith(sessionId === undefined ? [] : [{ sessionId }]).rejects(error);
    },
    getLastCallFor: ({ sessionId }: { sessionId: string }): unknown =>
      handle.callsMatching([{ sessionId }]).at(-1)?.[0],
  };
};
