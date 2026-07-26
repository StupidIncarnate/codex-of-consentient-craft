import type { QuestId, QuestStub } from '@dungeonmaster/shared/contracts';
import { orchestratorAbandonQuestAdapterProxy } from '../../../adapters/orchestrator/abandon-quest/orchestrator-abandon-quest-adapter.proxy';
import { orchestratorGetQuestAdapterProxy } from '../../../adapters/orchestrator/get-quest/orchestrator-get-quest-adapter.proxy';
import { QuestAbandonResponder } from './quest-abandon-responder';

type Quest = ReturnType<typeof QuestStub>;

export const QuestAbandonResponderProxy = (): {
  setupQuest: (params: { quest: Quest }) => void;
  setupAbandonQuest: (params: { questId: QuestId; abandoned: boolean }) => void;
  setupAbandonQuestError: (params: { questId: QuestId; message: string }) => void;
  callResponder: typeof QuestAbandonResponder;
} => {
  const questProxy = orchestratorGetQuestAdapterProxy();
  const adapterProxy = orchestratorAbandonQuestAdapterProxy();

  return {
    setupQuest: ({ quest }: { quest: Quest }): void => {
      questProxy.returns({ questId: quest.id, result: { success: true, quest } as never });
    },
    setupAbandonQuest: ({ questId, abandoned }: { questId: QuestId; abandoned: boolean }): void => {
      adapterProxy.returns({ questId, abandoned });
    },
    setupAbandonQuestError: ({ questId, message }: { questId: QuestId; message: string }): void => {
      adapterProxy.throws({ questId, error: new Error(message) });
    },
    callResponder: QuestAbandonResponder,
  };
};
