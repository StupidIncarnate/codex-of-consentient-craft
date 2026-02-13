jest.mock('@dungeonmaster/orchestrator');

import { StartOrchestrator } from '@dungeonmaster/orchestrator';

export const orchestratorRemoveProjectAdapterProxy = (): {
  throws: (params: { error: Error }) => void;
} => {
  const mock = jest.mocked(StartOrchestrator.removeProject);

  mock.mockResolvedValue(undefined);

  return {
    throws: ({ error }: { error: Error }): void => {
      mock.mockRejectedValueOnce(error);
    },
  };
};
