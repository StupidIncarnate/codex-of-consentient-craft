import { StartOrchestratorProxy } from '@dungeonmaster/orchestrator/startup/start-orchestrator.proxy';
import { GetQuestResultStub } from '@dungeonmaster/shared/contracts/get-quest-result/get-quest-result.stub';
import type { QuestId } from '@dungeonmaster/shared/contracts';
import type { QuestStub } from '@dungeonmaster/shared/contracts/quest/quest.stub';
import { QuestPauseResponder } from './quest-pause-responder';

type Quest = ReturnType<typeof QuestStub>;

export const QuestPauseResponderProxy = (): {
  setupQuest: (params: { quest: Quest }) => void;
  setupPauseQuest: (params: { questId: QuestId; paused: boolean }) => void;
  setupPauseQuestError: (params: { questId: QuestId; message: string }) => void;
  callResponder: typeof QuestPauseResponder;
} => {
  const orchestrator = StartOrchestratorProxy();

  return {
    setupQuest: ({ quest }: { quest: Quest }): void => {
      orchestrator.getQuestReturns({
        questId: quest.id,
        result: GetQuestResultStub({ success: true, quest }),
      });
    },
    setupPauseQuest: ({ questId, paused }: { questId: QuestId; paused: boolean }): void => {
      orchestrator.pauseQuestReturns({ questId, paused });
    },
    setupPauseQuestError: ({ questId, message }: { questId: QuestId; message: string }): void => {
      orchestrator.pauseQuestThrows({ questId, error: new Error(message) });
    },
    callResponder: QuestPauseResponder,
  };
};
