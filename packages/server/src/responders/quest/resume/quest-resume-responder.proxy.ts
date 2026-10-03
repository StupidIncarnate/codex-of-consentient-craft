import { NativeErrorStub } from '#gateway/node/util__types/is-native-error/native-error.stub';
import { StartOrchestratorProxy } from '@dungeonmaster/orchestrator/startup/start-orchestrator.proxy';
import { DispatchStateStub } from '@dungeonmaster/shared/contracts/dispatch-state/dispatch-state.stub';
import { GetQuestResultStub } from '@dungeonmaster/shared/contracts/get-quest-result/get-quest-result.stub';
import type { QuestStatus } from '@dungeonmaster/shared/contracts';
import type { QuestStub } from '@dungeonmaster/shared/contracts/quest/quest.stub';
import { QuestResumeResponder } from './quest-resume-responder';

type Quest = ReturnType<typeof QuestStub>;

export const QuestResumeResponderProxy = (): {
  setupQuest: (params: { quest: Quest }) => void;
  setupResumeQuest: (params: {
    questId: Quest['id'];
    resumed: boolean;
    restoredStatus: QuestStatus;
  }) => void;
  setupResumeQuestError: (params: { questId: Quest['id']; message: string }) => void;
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
      questId: Quest['id'];
      resumed: boolean;
      restoredStatus: QuestStatus;
    }): void => {
      orchestrator.resumeQuestReturns({ questId, resumed, restoredStatus });
    },
    setupResumeQuestError: ({
      questId,
      message,
    }: {
      questId: Quest['id'];
      message: string;
    }): void => {
      orchestrator.resumeQuestThrows({ questId, error: NativeErrorStub({ message }) });
    },

    // The Node dispatcher starts — the ordinary case.
    setupDispatchPlays: (): void => {
      orchestrator.playDispatchReturns({ state: DispatchStateStub({ mode: 'node-playing' }) });
    },
    setupDispatchError: ({ message }: { message: string }): void => {
      orchestrator.playDispatchThrows({ error: NativeErrorStub({ message }) });
    },
    getDispatchPlayCalls: (): readonly unknown[] => orchestrator.playDispatchGetCalls(),

    callResponder: QuestResumeResponder,
  };
};
