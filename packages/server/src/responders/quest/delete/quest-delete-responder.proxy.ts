import { StartOrchestratorProxy } from '@dungeonmaster/orchestrator/startup/start-orchestrator.proxy';
import type { QuestId } from '@dungeonmaster/shared/contracts';
import type { QuestStub } from '@dungeonmaster/shared/contracts/quest/quest.stub';
import { QuestDeleteResponder } from './quest-delete-responder';

type Quest = ReturnType<typeof QuestStub>;

export const QuestDeleteResponderProxy = (): {
  setupQuest: (params: { quest: Quest }) => void;
  setupQuestNotFound: (params: { questId: QuestId }) => void;
  setupDeleteQuest: (params: { questId: QuestId; deleted: boolean }) => void;
  setupDeleteQuestError: (params: { questId: QuestId; message: string }) => void;
  callResponder: typeof QuestDeleteResponder;
} => {
  const orchestrator = StartOrchestratorProxy();

  return {
    setupQuest: ({ quest }: { quest: Quest }): void => {
      orchestrator.getQuestReturns({
        questId: quest.id,
        result: { success: true, quest } as never,
      });
    },
    setupQuestNotFound: ({ questId }: { questId: QuestId }): void => {
      orchestrator.getQuestReturns({
        questId,
        result: { success: false, error: 'Quest not found' } as never,
      });
    },
    setupDeleteQuest: ({ questId, deleted }: { questId: QuestId; deleted: boolean }): void => {
      orchestrator.deleteQuestReturns({ questId, deleted });
    },
    setupDeleteQuestError: ({ questId, message }: { questId: QuestId; message: string }): void => {
      orchestrator.deleteQuestThrows({ questId, error: new Error(message) });
    },
    callResponder: QuestDeleteResponder,
  };
};
