import { StartOrchestratorProxy } from '@dungeonmaster/orchestrator/startup/start-orchestrator.proxy';
import type { QuestStub } from '@dungeonmaster/shared/contracts/quest/quest.stub';
import { QuestDeleteResponder } from './quest-delete-responder';

type Quest = ReturnType<typeof QuestStub>;

export const QuestDeleteResponderProxy = (): {
  setupQuest: (params: { quest: Quest }) => void;
  setupQuestNotFound: (params: { questId: Quest['id'] }) => void;
  setupDeleteQuest: (params: { questId: Quest['id']; deleted: boolean }) => void;
  setupDeleteQuestError: (params: { questId: Quest['id']; message: string }) => void;
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
    setupQuestNotFound: ({ questId }: { questId: Quest['id'] }): void => {
      orchestrator.getQuestReturns({
        questId,
        result: { success: false, error: 'Quest not found' } as never,
      });
    },
    setupDeleteQuest: ({ questId, deleted }: { questId: Quest['id']; deleted: boolean }): void => {
      orchestrator.deleteQuestReturns({ questId, deleted });
    },
    setupDeleteQuestError: ({
      questId,
      message,
    }: {
      questId: Quest['id'];
      message: string;
    }): void => {
      orchestrator.deleteQuestThrows({ questId, error: new Error(message) });
    },
    callResponder: QuestDeleteResponder,
  };
};
