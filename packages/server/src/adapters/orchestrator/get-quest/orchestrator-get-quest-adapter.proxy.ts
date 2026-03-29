import { StartOrchestrator } from '@dungeonmaster/orchestrator';
import type { GetQuestResult } from '@dungeonmaster/orchestrator';
import { registerMock } from '@dungeonmaster/testing/register-mock';

export const orchestratorGetQuestAdapterProxy = (): {
  returns: (params: { result: GetQuestResult }) => void;
  throws: (params: { error: Error }) => void;
} => {
  const mock = registerMock({ fn: StartOrchestrator.getQuest });

  mock.mockResolvedValue({ quest: {} } as never);

  return {
    returns: ({ result }: { result: GetQuestResult }): void => {
      mock.mockResolvedValueOnce(result);
    },
    throws: ({ error }: { error: Error }): void => {
      mock.mockRejectedValueOnce(error);
    },
  };
};
