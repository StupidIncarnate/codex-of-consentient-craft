import { StartOrchestratorProxy } from '@dungeonmaster/orchestrator/startup/start-orchestrator.proxy';
import { DispatchStateStub } from '@dungeonmaster/shared/contracts/dispatch-state/dispatch-state.stub';
import { GetQuestResultStub } from '@dungeonmaster/shared/contracts/get-quest-result/get-quest-result.stub';
import type { QuestId, QuestStatus } from '@dungeonmaster/shared/contracts';
import type { QuestStub } from '@dungeonmaster/shared/contracts/quest/quest.stub';
import { QuestResumeResponder } from './quest-resume-responder';

type Quest = ReturnType<typeof QuestStub>;

export const QuestResumeResponderProxy = (): {
  setupQuest: (params: { quest: Quest }) => void;
  setupResumeQuest: (params: {
    questId: QuestId;
    resumed: boolean;
    restoredStatus: QuestStatus;
  }) => void;
  setupResumeQuestError: (params: { questId: QuestId; message: string }) => void;
  setupDispatchPlays: () => void;
  setupDispatchError: (params: { message: string }) => void;
  getDispatchPlayCalls: () => readonly unknown[];
  callResponder: typeof QuestResumeResponder;
} => {
  const orchestrator = StartOrchestratorProxy();

  return {
    setupQuest: ({ quest }: { quest: Quest }): void => {
      orchestrator.getQuestReturns({
        questId: quest.id,
        result: GetQuestResultStub({ success: true, quest }),
      });
    },
    setupResumeQuest: ({
      questId,
      resumed,
      restoredStatus,
    }: {
      questId: QuestId;
      resumed: boolean;
      restoredStatus: QuestStatus;
    }): void => {
      orchestrator.resumeQuestReturns({ questId, resumed, restoredStatus });
    },
    setupResumeQuestError: ({ questId, message }: { questId: QuestId; message: string }): void => {
      orchestrator.resumeQuestThrows({ questId, error: new Error(message) });
    },

    // The Node dispatcher starts — the ordinary case.
    setupDispatchPlays: (): void => {
      orchestrator.playDispatchReturns({ state: DispatchStateStub({ mode: 'node-playing' }) });
    },
    setupDispatchError: ({ message }: { message: string }): void => {
      orchestrator.playDispatchThrows({ error: new Error(message) });
    },
    getDispatchPlayCalls: (): readonly unknown[] => orchestrator.playDispatchGetCalls(),

    callResponder: QuestResumeResponder,
  };
};
