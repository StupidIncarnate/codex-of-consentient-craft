/**
 * PURPOSE: Proxy for orchestrator-register-monitor-session-adapter that mocks the orchestrator package
 *
 * USAGE:
 * const proxy = orchestratorRegisterMonitorSessionAdapterProxy();
 * proxy.returns({ result: RegisterMonitorSessionResultStub() });
 */

import { StartOrchestrator } from '@dungeonmaster/orchestrator';
import type { RegisterMonitorSessionResult } from '@dungeonmaster/orchestrator';
import { RegisterMonitorSessionResultStub } from '@dungeonmaster/orchestrator/testing';
import { registerMock } from '@dungeonmaster/testing/register-mock';

export const orchestratorRegisterMonitorSessionAdapterProxy = (): {
  returns: (params: { result: RegisterMonitorSessionResult }) => void;
  throws: (params: { error: Error }) => void;
} => {
  const handle = registerMock({ fn: StartOrchestrator.registerMonitorSession });

  handle.mockResolvedValue(RegisterMonitorSessionResultStub());

  return {
    returns: ({ result }: { result: RegisterMonitorSessionResult }): void => {
      handle.mockResolvedValueOnce(result);
    },
    throws: ({ error }: { error: Error }): void => {
      handle.mockRejectedValueOnce(error);
    },
  };
};
