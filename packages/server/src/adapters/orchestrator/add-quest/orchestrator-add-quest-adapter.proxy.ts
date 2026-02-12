jest.mock('@dungeonmaster/orchestrator');

import { StartOrchestrator } from '@dungeonmaster/orchestrator';
import type { AddQuestResult } from '@dungeonmaster/orchestrator';

export const orchestratorAddQuestAdapterProxy = (): {
  returns: (params: { result: AddQuestResult }) => void;
  throws: (params: { error: Error }) => void;
} => {
  const mock = jest.mocked(StartOrchestrator.addQuest);

  mock.mockResolvedValue({
    success: true,
    questId: 'stub-quest',
    questFolder: '001-stub',
    filePath: '/stub',
  } as never);

  return {
    returns: ({ result }: { result: AddQuestResult }): void => {
      mock.mockResolvedValueOnce(result);
    },
    throws: ({ error }: { error: Error }): void => {
      mock.mockRejectedValueOnce(error);
    },
  };
};
