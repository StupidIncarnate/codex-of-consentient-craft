import type { QuestId, QuestStub } from '@dungeonmaster/shared/contracts';
import { orchestratorDeleteQuestAdapterProxy } from '../../../adapters/orchestrator/delete-quest/orchestrator-delete-quest-adapter.proxy';
import { orchestratorGetQuestAdapterProxy } from '../../../adapters/orchestrator/get-quest/orchestrator-get-quest-adapter.proxy';
import { QuestDeleteResponder } from './quest-delete-responder';

type Quest = ReturnType<typeof QuestStub>;

export const QuestDeleteResponderProxy = (): {
  setupQuest: (params: { quest: Quest }) => void;
  setupQuestNotFound: (params: { questId: QuestId }) => void;
  setupDeleteQuest: (params: { questId: QuestId; deleted: boolean }) => void;
  setupDeleteQuestError: (params: { questId: QuestId; message: string }) => void;
  callResponder: typeof QuestDeleteResponder;
} => {
  const questProxy = orchestratorGetQuestAdapterProxy();
  const adapterProxy = orchestratorDeleteQuestAdapterProxy();

  return {
    setupQuest: ({ quest }: { quest: Quest }): void => {
      questProxy.returns({ questId: quest.id, result: { success: true, quest } as never });
    },
    setupQuestNotFound: ({ questId }: { questId: QuestId }): void => {
      questProxy.returns({
        questId,
        result: { success: false, error: 'Quest not found' } as never,
      });
    },
    setupDeleteQuest: ({ questId, deleted }: { questId: QuestId; deleted: boolean }): void => {
      adapterProxy.returns({ questId, deleted });
    },
    setupDeleteQuestError: ({ questId, message }: { questId: QuestId; message: string }): void => {
      adapterProxy.throws({ questId, error: new Error(message) });
    },
    callResponder: QuestDeleteResponder,
  };
};
