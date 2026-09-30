import type { QuestStub } from '@dungeonmaster/shared/contracts/quest/quest.stub';
import { StartOrchestratorProxy } from '@dungeonmaster/orchestrator/startup/start-orchestrator.proxy';
import { QuestAbandonResponder } from './quest-abandon-responder';

type Quest = ReturnType<typeof QuestStub>;

export const QuestAbandonResponderProxy = (): {
  setupQuest: (params: { quest: Quest }) => void;
  setupAbandonQuest: (params: { questId: Quest['id']; abandoned: boolean }) => void;
  setupAbandonQuestError: (params: { questId: Quest['id']; message: string }) => void;
  callResponder: typeof QuestAbandonResponder;
} => {
  const orchestrator = StartOrchestratorProxy();

  return {
    setupQuest: ({ quest }: { quest: Quest }): void => {
      orchestrator.getQuestReturns({
        questId: quest.id,
        result: { success: true, quest } as never,
      });
    },
    setupAbandonQuest: ({
      questId,
      abandoned,
    }: {
      questId: Quest['id'];
      abandoned: boolean;
    }): void => {
      orchestrator.abandonQuestReturns({ questId, abandoned });
    },
    setupAbandonQuestError: ({
      questId,
      message,
    }: {
      questId: Quest['id'];
      message: string;
    }): void => {
      orchestrator.abandonQuestThrows({ questId, error: new Error(message) });
    },
    callResponder: QuestAbandonResponder,
  };
};
