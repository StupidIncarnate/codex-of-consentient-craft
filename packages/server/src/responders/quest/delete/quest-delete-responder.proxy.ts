import type { QuestStub } from '@dungeonmaster/shared/contracts';
import { orchestratorDeleteQuestAdapterProxy } from '../../../adapters/orchestrator/delete-quest/orchestrator-delete-quest-adapter.proxy';
import { orchestratorGetQuestAdapterProxy } from '../../../adapters/orchestrator/get-quest/orchestrator-get-quest-adapter.proxy';
import { QuestDeleteResponder } from './quest-delete-responder';

type Quest = ReturnType<typeof QuestStub>;

export const QuestDeleteResponderProxy = (): {
  setupQuest: (params: { quest: Quest }) => void;
  setupQuestNotFound: () => void;
  setupDeleteQuest: (params: { deleted: boolean }) => void;
  setupDeleteQuestError: (params: { message: string }) => void;
  callResponder: typeof QuestDeleteResponder;
} => {
  const questProxy = orchestratorGetQuestAdapterProxy();
  const adapterProxy = orchestratorDeleteQuestAdapterProxy();

  return {
    setupQuest: ({ quest }: { quest: Quest }): void => {
      questProxy.returns({ result: { success: true, quest } as never });
    },
    setupQuestNotFound: (): void => {
      questProxy.returns({ result: { success: false, error: 'Quest not found' } as never });
    },
    setupDeleteQuest: ({ deleted }: { deleted: boolean }): void => {
      adapterProxy.returns({ deleted });
    },
    setupDeleteQuestError: ({ message }: { message: string }): void => {
      adapterProxy.throws({ error: new Error(message) });
    },
    callResponder: QuestDeleteResponder,
  };
};
