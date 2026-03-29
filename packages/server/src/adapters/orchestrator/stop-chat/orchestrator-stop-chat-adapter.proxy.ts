import { StartOrchestrator } from '@dungeonmaster/orchestrator';
import { registerMock } from '@dungeonmaster/testing/register-mock';

export const orchestratorStopChatAdapterProxy = (): {
  returns: (params: { stopped: boolean }) => void;
  throws: (params: { error: Error }) => void;
} => {
  const mock = registerMock({ fn: StartOrchestrator.stopChat });

  mock.mockReturnValue(true);

  return {
    returns: ({ stopped }: { stopped: boolean }): void => {
      mock.mockReturnValueOnce(stopped);
    },
    throws: ({ error }: { error: Error }): void => {
      mock.mockImplementationOnce(() => {
        throw error;
      });
    },
  };
};
