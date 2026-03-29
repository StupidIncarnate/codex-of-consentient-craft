import { StartOrchestrator } from '@dungeonmaster/orchestrator';
import type { VerifyQuestResult } from '@dungeonmaster/orchestrator';
import { registerMock } from '@dungeonmaster/testing/register-mock';

export const orchestratorVerifyQuestAdapterProxy = (): {
  returns: (params: { result: VerifyQuestResult }) => void;
  throws: (params: { error: Error }) => void;
} => {
  const mock = registerMock({ fn: StartOrchestrator.verifyQuest });

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
