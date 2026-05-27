/**
 * PURPOSE: Proxy for orchestrator-get-server-config-adapter that mocks the orchestrator package
 *
 * USAGE:
 * const proxy = orchestratorGetServerConfigAdapterProxy();
 * proxy.returns({ result: QuestGetServerConfigResultStub() });
 */

import { StartOrchestrator } from '@dungeonmaster/orchestrator';
import type { QuestGetServerConfigResult } from '@dungeonmaster/orchestrator';
import { QuestGetServerConfigResultStub } from '@dungeonmaster/orchestrator/testing';
import { registerMock } from '@dungeonmaster/testing/register-mock';

export const orchestratorGetServerConfigAdapterProxy = (): {
  returns: (params: { result: QuestGetServerConfigResult }) => void;
  throws: (params: { error: Error }) => void;
} => {
  const handle = registerMock({ fn: StartOrchestrator.getServerConfig });

  handle.mockReturnValue(QuestGetServerConfigResultStub());

  return {
    returns: ({ result }: { result: QuestGetServerConfigResult }): void => {
      handle.mockReturnValueOnce(result);
    },
    throws: ({ error }: { error: Error }): void => {
      handle.mockImplementationOnce(() => {
        throw error;
      });
    },
  };
};
