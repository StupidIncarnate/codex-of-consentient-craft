/**
 * PURPOSE: Proxy for orchestrator-start-quest-adapter that mocks the orchestrator package
 *
 * USAGE:
 * const proxy = orchestratorStartQuestAdapterProxy();
 * proxy.returns({ processId: ProcessIdStub() });
 */

import { StartOrchestrator } from '@dungeonmaster/orchestrator';
import { ProcessIdStub } from '@dungeonmaster/shared/contracts';
import { registerMock } from '@dungeonmaster/testing/register-mock';

type ProcessId = ReturnType<typeof ProcessIdStub>;

export const orchestratorStartQuestAdapterProxy = (): {
  returns: (params: { processId: ProcessId }) => void;
  throws: (params: { error: Error }) => void;
} => {
  const handle = registerMock({ fn: StartOrchestrator.startQuest });

  handle.mockResolvedValue(ProcessIdStub());

  return {
    returns: ({ processId }: { processId: ProcessId }): void => {
      handle.mockResolvedValueOnce(processId);
    },
    throws: ({ error }: { error: Error }): void => {
      handle.mockRejectedValueOnce(error);
    },
  };
};
