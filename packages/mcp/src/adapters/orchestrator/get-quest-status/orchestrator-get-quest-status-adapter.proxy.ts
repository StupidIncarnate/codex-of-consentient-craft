/**
 * PURPOSE: Proxy for orchestrator-get-quest-status-adapter that mocks the orchestrator package
 *
 * USAGE:
 * const proxy = orchestratorGetQuestStatusAdapterProxy();
 * proxy.returns({ status: OrchestrationStatusStub() });
 */

import { StartOrchestrator } from '@dungeonmaster/orchestrator';
import { OrchestrationStatusStub } from '@dungeonmaster/shared/contracts';

jest.mock('@dungeonmaster/orchestrator');

type OrchestrationStatus = ReturnType<typeof OrchestrationStatusStub>;

export const orchestratorGetQuestStatusAdapterProxy = (): {
  returns: (params: { status: OrchestrationStatus }) => void;
  throws: (params: { error: Error }) => void;
} => {
  const mock = jest.mocked(StartOrchestrator.getQuestStatus);

  mock.mockReturnValue(OrchestrationStatusStub());

  return {
    returns: ({ status }: { status: OrchestrationStatus }): void => {
      mock.mockReturnValueOnce(status);
    },
    throws: ({ error }: { error: Error }): void => {
      mock.mockImplementationOnce(() => {
        throw error;
      });
    },
  };
};
