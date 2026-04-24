/**
 * PURPOSE: Type contracts for the cross-guild quest execution queue runner — deps shape (callbacks) + controller shape (start/stop/kick)
 *
 * USAGE:
 * const runner: QuestExecutionQueueRunnerController = questExecutionQueueRunnerBroker(deps);
 * // deps satisfies QuestExecutionQueueRunnerDeps
 */

import { z } from 'zod';

import type { AdapterResult, QuestQueueEntry, QuestStatus } from '@dungeonmaster/shared/contracts';

export type QuestExecutionQueueChangeHandler = () => void;

export interface QuestExecutionQueueRunnerDeps {
  getHead: () => QuestQueueEntry | undefined;
  dequeueHead: () => QuestQueueEntry | undefined;
  markHeadStarted: () => void;
  setHeadError: ({ message }: { message: string }) => void;
  removeByQuestId: ({ questId }: { questId: QuestQueueEntry['questId'] }) => void;
  onQueueChange: ({ handler }: { handler: QuestExecutionQueueChangeHandler }) => void;
  offQueueChange: ({ handler }: { handler: QuestExecutionQueueChangeHandler }) => void;
  isWebPresent: () => boolean;
  runOrchestrationLoop: ({
    questId,
    guildId,
  }: {
    questId: QuestQueueEntry['questId'];
    guildId: QuestQueueEntry['guildId'];
  }) => Promise<void>;
  getQuestStatus: ({
    questId,
    guildId,
  }: {
    questId: QuestQueueEntry['questId'];
    guildId: QuestQueueEntry['guildId'];
  }) => Promise<QuestStatus | undefined>;
  emitQueueUpdated: () => void;
  emitQueueError: ({ message }: { message: string }) => void;
}

export interface QuestExecutionQueueRunnerController {
  start: () => AdapterResult;
  stop: () => AdapterResult;
  kick: () => Promise<AdapterResult>;
}

// Runtime marker contract — callable function shapes cannot be fully Zod-validated,
// so this schema just asserts the controller has start/stop/kick functions.
export const questExecutionQueueRunnerContract = z.object({
  start: z.function(),
  stop: z.function(),
  kick: z.function(),
});
