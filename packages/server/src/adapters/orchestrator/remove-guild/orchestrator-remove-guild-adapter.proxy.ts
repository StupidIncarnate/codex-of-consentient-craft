jest.mock('@dungeonmaster/orchestrator');

import { StartOrchestrator } from '@dungeonmaster/orchestrator';

export const orchestratorRemoveGuildAdapterProxy = (): {
  throws: (params: { error: Error }) => void;
} => {
  const mock = jest.mocked(StartOrchestrator.removeGuild);

  mock.mockResolvedValue(undefined);

  return {
    throws: ({ error }: { error: Error }): void => {
      mock.mockRejectedValueOnce(error);
    },
  };
};
