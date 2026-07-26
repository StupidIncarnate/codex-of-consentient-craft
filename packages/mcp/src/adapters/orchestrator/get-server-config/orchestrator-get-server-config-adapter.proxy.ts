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

  // getServerConfig takes no arguments — [] is the only possible address.
  handle.calledWith([]).returns(QuestGetServerConfigResultStub());

  return {
    returns: ({ result }: { result: QuestGetServerConfigResult }): void => {
      handle.calledWith([]).returns(result);
    },
    throws: ({ error }: { error: Error }): void => {
      handle.calledWith([]).implement(() => {
        throw error;
      });
    },
  };
};
