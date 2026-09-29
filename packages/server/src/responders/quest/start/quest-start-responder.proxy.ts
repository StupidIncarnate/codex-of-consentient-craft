import { StartOrchestratorProxy } from '@dungeonmaster/orchestrator/startup/start-orchestrator.proxy';
import { DispatchStateStub } from '@dungeonmaster/shared/contracts/dispatch-state/dispatch-state.stub';
import { GetQuestResultStub } from '@dungeonmaster/shared/contracts/get-quest-result/get-quest-result.stub';
import type { QuestId } from '@dungeonmaster/shared/contracts';
import type { ProcessIdStub } from '@dungeonmaster/shared/contracts/process-id/process-id.stub';
import type { QuestStub } from '@dungeonmaster/shared/contracts/quest/quest.stub';
import { QuestStartResponder } from './quest-start-responder';

type ProcessId = ReturnType<typeof ProcessIdStub>;
type Quest = ReturnType<typeof QuestStub>;

export const QuestStartResponderProxy = (): {
  setupQuest: (params: { quest: Quest }) => void;
  setupStartQuest: (params: { questId: QuestId; processId: ProcessId }) => void;
  setupStartQuestError: (params: { questId: QuestId; message: string }) => void;
  setupDispatchPlays: () => void;
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

    // The Node dispatcher starts — the ordinary case.
    setupDispatchPlays: (): void => {
      orchestrator.playDispatchReturns({ state: DispatchStateStub({ mode: 'node-playing' }) });
    },
    setupDispatchError: ({ message }: { message: string }): void => {
      orchestrator.playDispatchThrows({ error: new Error(message) });
    },
    getDispatchPlayCalls: (): readonly unknown[] => orchestrator.playDispatchGetCalls(),

    callResponder: QuestStartResponder,
  };
};
