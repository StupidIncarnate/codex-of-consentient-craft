import { StartOrchestrator } from '@dungeonmaster/orchestrator';
import { registerMock } from '@dungeonmaster/testing/register-mock';

export const orchestratorDeleteQuestAdapterProxy = (): {
  returns: (params: { deleted: boolean }) => void;
  throws: (params: { error: Error }) => void;
  getLastCalledArgs: () => unknown;
} => {
  const mock = registerMock({ fn: StartOrchestrator.deleteQuest });

  mock.mockResolvedValue({ deleted: true });

  return {
    returns: ({ deleted }: { deleted: boolean }): void => {
      mock.mockResolvedValueOnce({ deleted });
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
