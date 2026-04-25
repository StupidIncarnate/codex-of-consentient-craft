/**
 * PURPOSE: In-memory cross-guild FIFO queue of quests awaiting execution — one runner picks the head, runs it, dequeues on terminal
 *
 * USAGE:
 * questExecutionQueueState.enqueue({ entry });
 * questExecutionQueueState.getActive();
 * questExecutionQueueState.dequeueHead();
 * questExecutionQueueState.getAll();
 * questExecutionQueueState.onChange(handler);
 * questExecutionQueueState.offChange(handler);
 * questExecutionQueueState.clearBySource({ questSource });
 * questExecutionQueueState.setHeadError({ message });
 * questExecutionQueueState.markHeadStarted();
 * questExecutionQueueState.removeByQuestId({ questId });
 * questExecutionQueueState.updateEntryStatus({ questId, status });
 */

import type {
  QuestId,
  QuestQueueEntry,
  QuestSource,
  QuestStatus,
} from '@dungeonmaster/shared/contracts';
import { questQueueEntryContract } from '@dungeonmaster/shared/contracts';

import type { RemovedCount } from '../../contracts/removed-count/removed-count-contract';
import { removedCountContract } from '../../contracts/removed-count/removed-count-contract';

type ChangeHandler = () => void;

const state: {
  entries: QuestQueueEntry[];
  handlers: Set<ChangeHandler>;
} = {
  entries: [],
  handlers: new Set(),
};

export const questExecutionQueueState = {
  enqueue: ({ entry }: { entry: QuestQueueEntry }): void => {
    state.entries.push(entry);
    for (const handler of state.handlers) {
      handler();
    }
  },

  dequeueHead: (): QuestQueueEntry | undefined => {
    const head = state.entries.shift();
    if (head !== undefined) {
      for (const handler of state.handlers) {
        handler();
      }
    }
    return head;
  },

  getActive: (): QuestQueueEntry | undefined => state.entries[0],

  getAll: (): readonly QuestQueueEntry[] => state.entries.slice(),

  onChange: (handler: ChangeHandler): void => {
    state.handlers.add(handler);
  },

  offChange: (handler: ChangeHandler): void => {
    state.handlers.delete(handler);
  },

  clearBySource: ({ questSource }: { questSource: QuestSource }): RemovedCount => {
    const before = state.entries.length;
    state.entries = state.entries.filter((entry) => entry.questSource !== questSource);
    const removed = before - state.entries.length;
    if (removed > 0) {
      for (const handler of state.handlers) {
        handler();
      }
    }
    return removedCountContract.parse(removed);
  },

  setHeadError: ({ message }: { message: string }): void => {
    const [head] = state.entries;
    if (head === undefined) {
      return;
    }
    const updated = questQueueEntryContract.parse({
      ...head,
      error: {
        message,
        at: new Date().toISOString(),
      },
    });
    state.entries[0] = updated;
    for (const handler of state.handlers) {
      handler();
    }
  },

  markHeadStarted: (): void => {
    const [head] = state.entries;
    if (head === undefined) {
      return;
    }
    if (head.startedAt !== undefined) {
      return;
    }
    const updated = questQueueEntryContract.parse({
      ...head,
      startedAt: new Date().toISOString(),
    });
    state.entries[0] = updated;
    for (const handler of state.handlers) {
      handler();
    }
  },

  removeByQuestId: ({ questId }: { questId: QuestId }): RemovedCount => {
    const before = state.entries.length;
    state.entries = state.entries.filter((entry) => entry.questId !== questId);
    const removed = before - state.entries.length;
    if (removed > 0) {
      for (const handler of state.handlers) {
        handler();
      }
    }
    return removedCountContract.parse(removed);
  },

  removeByGuildId: ({ guildId }: { guildId: QuestQueueEntry['guildId'] }): RemovedCount => {
    const before = state.entries.length;
    state.entries = state.entries.filter((entry) => entry.guildId !== guildId);
    const removed = before - state.entries.length;
    if (removed > 0) {
      for (const handler of state.handlers) {
        handler();
      }
    }
    return removedCountContract.parse(removed);
  },

  updateEntryStatus: ({ questId, status }: { questId: QuestId; status: QuestStatus }): boolean => {
    const index = state.entries.findIndex((entry) => entry.questId === questId);
    if (index === -1) {
      return false;
    }
    const existing = state.entries[index];
    if (existing === undefined) {
      return false;
    }
    if (existing.status === status) {
      return false;
    }
    const updated = questQueueEntryContract.parse({
      ...existing,
      status,
    });
    state.entries[index] = updated;
    for (const handler of state.handlers) {
      handler();
    }
    return true;
  },

  clear: (): void => {
    state.entries = [];
    state.handlers.clear();
  },
};
