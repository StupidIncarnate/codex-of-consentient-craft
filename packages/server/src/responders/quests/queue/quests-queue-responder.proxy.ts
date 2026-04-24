import { orchestratorGetQuestQueueAdapterProxy } from '../../../adapters/orchestrator/get-quest-queue/orchestrator-get-quest-queue-adapter.proxy';
import type { QuestQueueEntryStub } from '@dungeonmaster/shared/contracts';
import { QuestsQueueResponder } from './quests-queue-responder';

type QuestQueueEntry = ReturnType<typeof QuestQueueEntryStub>;

export const QuestsQueueResponderProxy = (): {
  setupQueue: (params: { entries: readonly QuestQueueEntry[] }) => void;
  setupQueueError: (params: { message: string }) => void;
  callResponder: typeof QuestsQueueResponder;
} => {
  const adapterProxy = orchestratorGetQuestQueueAdapterProxy();

  return {
    setupQueue: ({ entries }: { entries: readonly QuestQueueEntry[] }): void => {
      adapterProxy.returns({ entries });
    },
    setupQueueError: ({ message }: { message: string }): void => {
      adapterProxy.throws({ error: new Error(message) });
    },
    callResponder: QuestsQueueResponder,
  };
};
