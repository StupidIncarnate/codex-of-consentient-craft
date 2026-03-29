/**
 * PURPOSE: Proxy for orchestrator-get-quest-status-adapter that mocks the orchestrator package
 *
 * USAGE:
 * const proxy = orchestratorGetQuestStatusAdapterProxy();
 * proxy.returns({ status: OrchestrationStatusStub() });
 */

import { StartOrchestrator } from '@dungeonmaster/orchestrator';
import { OrchestrationStatusStub } from '@dungeonmaster/shared/contracts';
import { registerMock } from '@dungeonmaster/testing/register-mock';

type OrchestrationStatus = ReturnType<typeof OrchestrationStatusStub>;

export const orchestratorGetQuestStatusAdapterProxy = (): {
  returns: (params: { status: OrchestrationStatus }) => void;
  throws: (params: { error: Error }) => void;
} => {
  const handle = registerMock({ fn: StartOrchestrator.getQuestStatus });

  handle.mockReturnValue(OrchestrationStatusStub());

  return {
    returns: ({ status }: { status: OrchestrationStatus }): void => {
      handle.mockReturnValueOnce(status);
    },
    throws: ({ error }: { error: Error }): void => {
      handle.mockImplementationOnce(() => {
        throw error;
      });
    },
  };
};
