jest.mock('@dungeonmaster/orchestrator');

import { StartOrchestrator } from '@dungeonmaster/orchestrator';
import { ProcessIdStub } from '@dungeonmaster/shared/contracts';

type ProcessId = ReturnType<typeof ProcessIdStub>;

export const orchestratorStartChatAdapterProxy = (): {
  returns: (params: { chatProcessId: ProcessId }) => void;
  throws: (params: { error: Error }) => void;
  getLastCalledArgs: () => unknown;
} => {
  const mock = jest.mocked(StartOrchestrator.startChat);

  mock.mockResolvedValue({ chatProcessId: ProcessIdStub() });

  return {
    returns: ({ chatProcessId }: { chatProcessId: ProcessId }): void => {
      mock.mockResolvedValueOnce({ chatProcessId });
    },
    throws: ({ error }: { error: Error }): void => {
      mock.mockRejectedValueOnce(error);
    },
    getLastCalledArgs: (): unknown => {
      const { calls } = mock.mock;
      const lastCall = calls[calls.length - 1];
      if (!lastCall) return undefined;
      return lastCall[0];
    },
  };
};
