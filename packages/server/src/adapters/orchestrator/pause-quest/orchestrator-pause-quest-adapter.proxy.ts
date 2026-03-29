import { StartOrchestrator } from '@dungeonmaster/orchestrator';
import { registerMock } from '@dungeonmaster/testing/register-mock';

export const orchestratorPauseQuestAdapterProxy = (): {
  returns: (params: { paused: boolean }) => void;
  throws: (params: { error: Error }) => void;
} => {
  const mock = registerMock({ fn: StartOrchestrator.pauseQuest });

  mock.mockResolvedValue({ paused: true });

  return {
    returns: ({ paused }: { paused: boolean }): void => {
      mock.mockResolvedValueOnce({ paused });
    },
    throws: ({ error }: { error: Error }): void => {
      mock.mockRejectedValueOnce(error);
    },
  };
};
