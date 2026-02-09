/**
 * PURPOSE: Proxy for orchestratorListQuestsAdapter that mocks the orchestrator package
 *
 * USAGE:
 * const proxy = orchestratorListQuestsAdapterProxy();
 * proxy.returns({ quests });
 */
import { StartOrchestrator } from '@dungeonmaster/orchestrator';
import type { QuestListItem } from '@dungeonmaster/shared/contracts';

jest.mock('@dungeonmaster/orchestrator', () => ({
  StartOrchestrator: {
    listQuests: jest.fn(),
  },
}));

const mockListQuests = jest.mocked(StartOrchestrator.listQuests);

export const orchestratorListQuestsAdapterProxy = (): {
  returns: (params: { quests: QuestListItem[] }) => void;
  throws: (params: { error: Error }) => void;
} => ({
  returns: ({ quests }: { quests: QuestListItem[] }): void => {
    mockListQuests.mockResolvedValue(quests);
  },
  throws: ({ error }: { error: Error }): void => {
    mockListQuests.mockRejectedValue(error);
  },
});
