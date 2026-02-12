jest.mock('@dungeonmaster/orchestrator');

import { StartOrchestrator } from '@dungeonmaster/orchestrator';
import type { QuestListItemStub } from '@dungeonmaster/shared/contracts';

type QuestListItem = ReturnType<typeof QuestListItemStub>;

export const orchestratorListQuestsAdapterProxy = (): {
  returns: (params: { quests: QuestListItem[] }) => void;
  throws: (params: { error: Error }) => void;
} => {
  const mock = jest.mocked(StartOrchestrator.listQuests);

  mock.mockResolvedValue([]);

  return {
    returns: ({ quests }: { quests: QuestListItem[] }): void => {
      mock.mockResolvedValueOnce(quests);
    },
    throws: ({ error }: { error: Error }): void => {
      mock.mockRejectedValueOnce(error);
    },
  };
};
