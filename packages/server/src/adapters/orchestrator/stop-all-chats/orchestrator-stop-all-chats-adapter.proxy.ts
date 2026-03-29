import { StartOrchestrator } from '@dungeonmaster/orchestrator';
import { registerMock } from '@dungeonmaster/testing/register-mock';

export const orchestratorStopAllChatsAdapterProxy = (): {
  throws: (params: { error: Error }) => void;
  wasCalled: () => boolean;
} => {
  const mock = registerMock({ fn: StartOrchestrator.stopAllChats });
  mock.mockReturnValue(undefined);

  return {
    throws: ({ error }: { error: Error }): void => {
      mock.mockImplementationOnce(() => {
        throw error;
      });
    },
    wasCalled: (): boolean => mock.mock.calls.length > 0,
  };
};
