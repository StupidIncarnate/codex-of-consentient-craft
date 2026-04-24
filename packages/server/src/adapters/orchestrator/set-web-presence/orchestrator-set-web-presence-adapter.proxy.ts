import { StartOrchestrator } from '@dungeonmaster/orchestrator';
import { registerMock } from '@dungeonmaster/testing/register-mock';

export const orchestratorSetWebPresenceAdapterProxy = (): {
  getLastCalledArgs: () => unknown;
  getAllCalledArgs: () => unknown[];
  throws: (params: { error: Error }) => void;
} => {
  const mock = registerMock({ fn: StartOrchestrator.setWebPresence });

  mock.mockReturnValue({ success: true });

  return {
    getLastCalledArgs: (): unknown => {
      const { calls } = mock.mock;
      const lastCall = calls[calls.length - 1];
      if (!lastCall) return undefined;
      return lastCall[0];
    },
    getAllCalledArgs: (): unknown[] => mock.mock.calls.map((call) => call[0]),
    throws: ({ error }: { error: Error }): void => {
      mock.mockImplementationOnce(() => {
        throw error;
      });
    },
  };
};
