jest.mock('@dungeonmaster/orchestrator');

import { StartOrchestrator } from '@dungeonmaster/orchestrator';

export const orchestratorPauseQuestAdapterProxy = (): {
  returns: (params: { paused: boolean }) => void;
  throws: (params: { error: Error }) => void;
} => {
  const mock = jest.mocked(StartOrchestrator.pauseQuest);

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
