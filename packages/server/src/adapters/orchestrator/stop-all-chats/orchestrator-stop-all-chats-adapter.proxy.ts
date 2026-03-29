jest.mock('@dungeonmaster/orchestrator');

import { StartOrchestrator } from '@dungeonmaster/orchestrator';

export const orchestratorStopAllChatsAdapterProxy = (): {
  throws: (params: { error: Error }) => void;
  wasCalled: () => boolean;
} => {
  const mock = jest.mocked(StartOrchestrator.stopAllChats);
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
