import { StartOrchestratorProxy } from '@dungeonmaster/orchestrator/startup/start-orchestrator.proxy';
import { DispatchPlayResponseStub } from '@dungeonmaster/orchestrator/testing';
import { GetQuestResultStub } from '@dungeonmaster/shared/contracts';
import type { QuestId, QuestStatus, QuestStub } from '@dungeonmaster/shared/contracts';
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
  setupDispatchRefused: (params: { reason: string }) => void;
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

    // The Node dispatcher accepts the play — the ordinary case, where nothing else owns the queue.
    setupDispatchPlays: (): void => {
      orchestrator.playDispatchReturns({ response: DispatchPlayResponseStub({ allowed: true }) });
    },
    // The exclusivity gate refuses: a live /dumpster-launch loop still owns the queue.
    setupDispatchRefused: ({ reason }: { reason: string }): void => {
      orchestrator.playDispatchReturns({
        response: DispatchPlayResponseStub({ allowed: false, reason: reason as never }),
      });
    },
    setupDispatchError: ({ message }: { message: string }): void => {
      orchestrator.playDispatchThrows({ error: new Error(message) });
    },
    getDispatchPlayCalls: (): readonly unknown[] => orchestrator.playDispatchGetCalls(),

    callResponder: QuestResumeResponder,
  };
};
