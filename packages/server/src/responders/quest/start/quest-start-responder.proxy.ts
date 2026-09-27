import { StartOrchestratorProxy } from '@dungeonmaster/orchestrator/startup/start-orchestrator.proxy';
import { DispatchPlayResponseStub } from '@dungeonmaster/orchestrator/testing';
import { GetQuestResultStub } from '@dungeonmaster/shared/contracts';
import type { ProcessIdStub, QuestId, QuestStub } from '@dungeonmaster/shared/contracts';
import { QuestStartResponder } from './quest-start-responder';

type ProcessId = ReturnType<typeof ProcessIdStub>;
type Quest = ReturnType<typeof QuestStub>;

export const QuestStartResponderProxy = (): {
  setupQuest: (params: { quest: Quest }) => void;
  setupStartQuest: (params: { questId: QuestId; processId: ProcessId }) => void;
  setupStartQuestError: (params: { questId: QuestId; message: string }) => void;
  setupDispatchPlays: () => void;
  setupDispatchRefused: (params: { reason: string }) => void;
  setupDispatchError: (params: { message: string }) => void;
  getDispatchPlayCalls: () => readonly unknown[];
  callResponder: typeof QuestStartResponder;
} => {
  const orchestrator = StartOrchestratorProxy();

  return {
    setupQuest: ({ quest }: { quest: Quest }): void => {
      orchestrator.getQuestReturns({
        questId: quest.id,
        result: GetQuestResultStub({ success: true, quest }),
      });
    },
    setupStartQuest: ({ questId, processId }: { questId: QuestId; processId: ProcessId }): void => {
      orchestrator.startQuestReturns({ questId, processId });
    },
    setupStartQuestError: ({ questId, message }: { questId: QuestId; message: string }): void => {
      orchestrator.startQuestThrows({ questId, error: new Error(message) });
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

    callResponder: QuestStartResponder,
  };
};
