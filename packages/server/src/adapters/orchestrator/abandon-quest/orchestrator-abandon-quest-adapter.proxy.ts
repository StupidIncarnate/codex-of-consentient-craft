import { StartOrchestrator } from '@dungeonmaster/orchestrator';
import { registerMock } from '@dungeonmaster/testing/register-mock';

export const orchestratorAbandonQuestAdapterProxy = (): {
  returns: (params: { abandoned: boolean }) => void;
  throws: (params: { error: Error }) => void;
} => {
  const mock = registerMock({ fn: StartOrchestrator.abandonQuest });

  mock.mockResolvedValue({ abandoned: true });

  return {
    returns: ({ abandoned }: { abandoned: boolean }): void => {
      mock.mockResolvedValueOnce({ abandoned });
    },
    throws: ({ error }: { error: Error }): void => {
      mock.mockRejectedValueOnce(error);
    },
  };
};
