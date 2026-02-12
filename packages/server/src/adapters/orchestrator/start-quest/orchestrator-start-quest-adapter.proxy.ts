jest.mock('@dungeonmaster/orchestrator');

import { StartOrchestrator } from '@dungeonmaster/orchestrator';
import { ProcessIdStub } from '@dungeonmaster/shared/contracts';

type ProcessId = ReturnType<typeof ProcessIdStub>;

export const orchestratorStartQuestAdapterProxy = (): {
  returns: (params: { processId: ProcessId }) => void;
  throws: (params: { error: Error }) => void;
} => {
  const mock = jest.mocked(StartOrchestrator.startQuest);

  mock.mockResolvedValue(ProcessIdStub());

  return {
    returns: ({ processId }: { processId: ProcessId }): void => {
      mock.mockResolvedValueOnce(processId);
    },
    throws: ({ error }: { error: Error }): void => {
      mock.mockRejectedValueOnce(error);
    },
  };
};
