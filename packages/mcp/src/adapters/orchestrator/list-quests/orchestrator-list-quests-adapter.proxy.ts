/**
 * PURPOSE: Proxy for orchestrator-list-quests-adapter that mocks the orchestrator package
 *
 * USAGE:
 * const proxy = orchestratorListQuestsAdapterProxy();
 * proxy.returns({ quests: [QuestListItemStub()] });
 */

import { StartOrchestrator } from '@dungeonmaster/orchestrator';
import type { QuestListItemStub } from '@dungeonmaster/shared/contracts';
import { registerMock } from '@dungeonmaster/testing/register-mock';

type QuestListItem = ReturnType<typeof QuestListItemStub>;

export const orchestratorListQuestsAdapterProxy = (): {
  returns: (params: { quests: QuestListItem[] }) => void;
  throws: (params: { error: Error }) => void;
} => {
  const handle = registerMock({ fn: StartOrchestrator.listQuests });

  handle.mockResolvedValue([]);

  return {
    returns: ({ quests }: { quests: QuestListItem[] }): void => {
      handle.mockResolvedValueOnce(quests);
    },
    throws: ({ error }: { error: Error }): void => {
      handle.mockRejectedValueOnce(error);
    },
  };
};
