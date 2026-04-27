import { StartOrchestrator } from '@dungeonmaster/orchestrator';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import type { QuestQueueEntryStub } from '@dungeonmaster/shared/contracts';

type QuestQueueEntry = ReturnType<typeof QuestQueueEntryStub>;

export const orchestratorGetQuestQueueAdapterProxy = (): {
  returns: (params: { entries: readonly QuestQueueEntry[] }) => void;
  throws: (params: { error: Error }) => void;
} => {
  const mock = registerMock({ fn: StartOrchestrator.getExecutionQueue });

  mock.mockResolvedValue([]);

  return {
    returns: ({ entries }: { entries: readonly QuestQueueEntry[] }): void => {
      mock.mockResolvedValueOnce(entries);
    },
    throws: ({ error }: { error: Error }): void => {
      mock.mockRejectedValueOnce(error);
    },
  };
};
