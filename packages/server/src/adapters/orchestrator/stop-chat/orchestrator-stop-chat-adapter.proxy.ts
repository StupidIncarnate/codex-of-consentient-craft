jest.mock('@dungeonmaster/orchestrator');

import { StartOrchestrator } from '@dungeonmaster/orchestrator';

export const orchestratorStopChatAdapterProxy = (): {
  returns: (params: { stopped: boolean }) => void;
  throws: (params: { error: Error }) => void;
} => {
  const mock = jest.mocked(StartOrchestrator.stopChat);

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
