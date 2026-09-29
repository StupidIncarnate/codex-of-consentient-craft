import type { QuestQueueEntryStub } from '@dungeonmaster/shared/contracts/quest-queue-entry/quest-queue-entry.stub';

import { questExecutionQueueState } from './quest-execution-queue-state';

type QueueEntry = ReturnType<typeof QuestQueueEntryStub>;

export const questExecutionQueueStateProxy = (): {
  setupEmpty: () => void;
  getAllEntries: () => readonly QueueEntry[];
} => ({
  setupEmpty: (): void => {
    questExecutionQueueState.clear();
  },
  getAllEntries: (): readonly QueueEntry[] => questExecutionQueueState.getAll(),
});
