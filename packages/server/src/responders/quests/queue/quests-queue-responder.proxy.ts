import { StartOrchestratorProxy } from '@dungeonmaster/orchestrator/startup/start-orchestrator.proxy';
import type { QuestQueueEntryStub } from '@dungeonmaster/shared/contracts/quest-queue-entry/quest-queue-entry.stub';
import { QuestsQueueResponder } from './quests-queue-responder';

type QuestQueueEntry = ReturnType<typeof QuestQueueEntryStub>;

export const QuestsQueueResponderProxy = (): {
  setupQueue: (params: { entries: readonly QuestQueueEntry[] }) => void;
  setupQueueError: (params: { message: string }) => void;
  callResponder: typeof QuestsQueueResponder;
} => {
  const orchestrator = StartOrchestratorProxy();

  return {
    setupQueue: ({ entries }: { entries: readonly QuestQueueEntry[] }): void => {
      orchestrator.getExecutionQueueReturns({ entries });
    },
    setupQueueError: ({ message }: { message: string }): void => {
      orchestrator.getExecutionQueueThrows({ error: new Error(message) });
    },
    callResponder: QuestsQueueResponder,
  };
};
