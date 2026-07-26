import { StartOrchestrator } from '@dungeonmaster/orchestrator';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import type { QuestListItemStub, SkippedQuestFileStub } from '@dungeonmaster/shared/contracts';

type QuestListItem = ReturnType<typeof QuestListItemStub>;
type SkippedQuestFile = ReturnType<typeof SkippedQuestFileStub>;

export const orchestratorListQuestsWithSkipsAdapterProxy = (): {
  returns: (params: { quests: QuestListItem[]; skipped: SkippedQuestFile[] }) => void;
  throws: (params: { error: Error }) => void;
} => {
  const mock = registerMock({ fn: StartOrchestrator.listQuestsWithSkips });

  mock.mockResolvedValue({ quests: [], skipped: [] });

  return {
    returns: ({
      quests,
      skipped,
    }: {
      quests: QuestListItem[];
      skipped: SkippedQuestFile[];
    }): void => {
      mock.mockResolvedValueOnce({ quests, skipped });
    },
    throws: ({ error }: { error: Error }): void => {
      mock.mockRejectedValueOnce(error);
    },
  };
};
