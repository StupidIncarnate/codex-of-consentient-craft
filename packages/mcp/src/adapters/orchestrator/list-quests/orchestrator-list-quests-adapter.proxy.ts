/**
 * PURPOSE: Proxy for orchestrator-list-quests-adapter that mocks the orchestrator package
 *
 * USAGE:
 * const proxy = orchestratorListQuestsAdapterProxy();
 * proxy.returns({ quests: [QuestListItemStub()] });
 */

import { StartOrchestrator } from '@dungeonmaster/orchestrator';
import type { QuestListItemStub } from '@dungeonmaster/shared/contracts';

jest.mock('@dungeonmaster/orchestrator');

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
