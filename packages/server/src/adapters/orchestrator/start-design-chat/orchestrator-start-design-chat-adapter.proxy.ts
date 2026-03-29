import { StartOrchestrator } from '@dungeonmaster/orchestrator';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import { ProcessIdStub } from '@dungeonmaster/shared/contracts';

type ProcessId = ReturnType<typeof ProcessIdStub>;

export const orchestratorStartDesignChatAdapterProxy = (): {
  returns: (params: { chatProcessId: ProcessId }) => void;
  throws: (params: { error: Error }) => void;
} => {
  const mock = registerMock({ fn: StartOrchestrator.startDesignChat });

  mock.mockResolvedValue({ chatProcessId: ProcessIdStub() });

  return {
    returns: ({ chatProcessId }: { chatProcessId: ProcessId }): void => {
      mock.mockResolvedValueOnce({ chatProcessId });
    },
    throws: ({ error }: { error: Error }): void => {
      mock.mockRejectedValueOnce(error);
    },
  };
};
