/**
 * PURPOSE: Proxy for orchestrator-get-monitor-session-adapter that mocks the orchestrator package
 *
 * USAGE:
 * const proxy = orchestratorGetMonitorSessionAdapterProxy();
 * proxy.returns({ session: { sessionId, projectDir } });
 * // or
 * proxy.returns({ session: null });
 */

import { StartOrchestrator } from '@dungeonmaster/orchestrator';
import type { FilePath, SessionId } from '@dungeonmaster/shared/contracts';
import { registerMock } from '@dungeonmaster/testing/register-mock';

export const orchestratorGetMonitorSessionAdapterProxy = (): {
  returns: (params: { session: { sessionId: SessionId; projectDir: FilePath } | null }) => void;
} => {
  const handle = registerMock({ fn: StartOrchestrator.getRegisteredMonitorSession });

  handle.mockReturnValue(null);

  return {
    returns: ({
      session,
    }: {
      session: { sessionId: SessionId; projectDir: FilePath } | null;
    }): void => {
      handle.mockReturnValueOnce(session);
    },
  };
};
