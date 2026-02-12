jest.mock('@dungeonmaster/orchestrator');

import { StartOrchestrator } from '@dungeonmaster/orchestrator';
import type { ModifyQuestResult } from '@dungeonmaster/orchestrator';

export const orchestratorModifyQuestAdapterProxy = (): {
  returns: (params: { result: ModifyQuestResult }) => void;
  throws: (params: { error: Error }) => void;
} => {
  const mock = jest.mocked(StartOrchestrator.modifyQuest);

  mock.mockResolvedValue({ success: true } as never);

  return {
    returns: ({ result }: { result: ModifyQuestResult }): void => {
      mock.mockResolvedValueOnce(result);
    },
    throws: ({ error }: { error: Error }): void => {
      mock.mockRejectedValueOnce(error);
    },
  };
};
