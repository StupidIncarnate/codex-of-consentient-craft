import type { ProcessIdStub, QuestId, QuestStub } from '@dungeonmaster/shared/contracts';
import { orchestratorGetQuestAdapterProxy } from '../../../adapters/orchestrator/get-quest/orchestrator-get-quest-adapter.proxy';
import { orchestratorStartQuestAdapterProxy } from '../../../adapters/orchestrator/start-quest/orchestrator-start-quest-adapter.proxy';
import { QuestStartResponder } from './quest-start-responder';

type ProcessId = ReturnType<typeof ProcessIdStub>;
type Quest = ReturnType<typeof QuestStub>;

export const QuestStartResponderProxy = (): {
  setupQuest: (params: { quest: Quest }) => void;
  setupStartQuest: (params: { questId: QuestId; processId: ProcessId }) => void;
  setupStartQuestError: (params: { questId: QuestId; message: string }) => void;
  callResponder: typeof QuestStartResponder;
} => {
  const questProxy = orchestratorGetQuestAdapterProxy();
  const adapterProxy = orchestratorStartQuestAdapterProxy();

  return {
    setupQuest: ({ quest }: { quest: Quest }): void => {
      questProxy.returns({ questId: quest.id, result: { success: true, quest } as never });
    },
    setupStartQuest: ({ questId, processId }: { questId: QuestId; processId: ProcessId }): void => {
      adapterProxy.returns({ questId, processId });
    },
    setupStartQuestError: ({ questId, message }: { questId: QuestId; message: string }): void => {
      adapterProxy.throws({ questId, error: new Error(message) });
    },
    callResponder: QuestStartResponder,
  };
};
