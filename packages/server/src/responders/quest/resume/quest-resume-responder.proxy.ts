import type { QuestId, QuestStatus, QuestStub } from '@dungeonmaster/shared/contracts';
import { DispatchStateStub } from '@dungeonmaster/shared/contracts';
import type { RecordedCalls } from '@dungeonmaster/testing/register-mock';
import { orchestratorGetQuestAdapterProxy } from '../../../adapters/orchestrator/get-quest/orchestrator-get-quest-adapter.proxy';
import { orchestratorPlayDispatchAdapterProxy } from '../../../adapters/orchestrator/play-dispatch/orchestrator-play-dispatch-adapter.proxy';
import { orchestratorResumeQuestAdapterProxy } from '../../../adapters/orchestrator/resume-quest/orchestrator-resume-quest-adapter.proxy';
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
  getDispatchPlayCalls: () => RecordedCalls;
  callResponder: typeof QuestResumeResponder;
} => {
  const questProxy = orchestratorGetQuestAdapterProxy();
  const adapterProxy = orchestratorResumeQuestAdapterProxy();
  const playProxy = orchestratorPlayDispatchAdapterProxy();

  return {
    setupQuest: ({ quest }: { quest: Quest }): void => {
      questProxy.returns({ questId: quest.id, result: { success: true, quest } as never });
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
      adapterProxy.returns({ questId, resumed, restoredStatus });
    },
    setupResumeQuestError: ({ questId, message }: { questId: QuestId; message: string }): void => {
      adapterProxy.throws({ questId, error: new Error(message) });
    },

    // The Node dispatcher starts — the ordinary case.
    setupDispatchPlays: (): void => {
      playProxy.returns({ state: DispatchStateStub({ mode: 'node-playing' }) });
    },
    setupDispatchError: ({ message }: { message: string }): void => {
      playProxy.throws({ error: new Error(message) });
    },
    getDispatchPlayCalls: (): RecordedCalls => playProxy.getCalls(),

    callResponder: QuestResumeResponder,
  };
};
