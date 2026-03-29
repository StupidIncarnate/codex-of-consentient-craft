import { StartOrchestrator } from '@dungeonmaster/orchestrator';
import type { ModifyQuestResult } from '@dungeonmaster/orchestrator';
import { registerMock } from '@dungeonmaster/testing/register-mock';

export const orchestratorModifyQuestAdapterProxy = (): {
  returns: (params: { result: ModifyQuestResult }) => void;
  throws: (params: { error: Error }) => void;
} => {
  const mock = registerMock({ fn: StartOrchestrator.modifyQuest });

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
