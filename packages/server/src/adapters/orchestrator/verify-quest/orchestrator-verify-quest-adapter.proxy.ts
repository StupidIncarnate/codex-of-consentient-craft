jest.mock('@dungeonmaster/orchestrator');

import { StartOrchestrator } from '@dungeonmaster/orchestrator';
import type { VerifyQuestResult } from '@dungeonmaster/orchestrator';

export const orchestratorVerifyQuestAdapterProxy = (): {
  returns: (params: { result: VerifyQuestResult }) => void;
  throws: (params: { error: Error }) => void;
} => {
  const mock = jest.mocked(StartOrchestrator.verifyQuest);

  mock.mockResolvedValue({ success: true, checks: [] } as never);

  return {
    returns: ({ result }: { result: VerifyQuestResult }): void => {
      mock.mockResolvedValueOnce(result);
    },
    throws: ({ error }: { error: Error }): void => {
      mock.mockRejectedValueOnce(error);
    },
  };
};
