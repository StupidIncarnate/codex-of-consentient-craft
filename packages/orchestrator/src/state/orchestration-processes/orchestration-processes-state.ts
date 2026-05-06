/**
 * PURPOSE: Manages state for tracking all running processes (orchestration and chat) by processId. Two registration shapes coexist: quest-level loop dispatchers (no `questWorkItemId`) found via `findByQuestId`, and per-agent launcher entries (with `questWorkItemId`) found via `findByQuestWorkItemId` for future per-agent message-injection.
 *
 * USAGE:
 * orchestrationProcessesState.register({orchestrationProcess});
 * orchestrationProcessesState.kill({processId});
 * orchestrationProcessesState.killAll();
 * orchestrationProcessesState.findByQuestWorkItemId({questWorkItemId});
 */

import type { ProcessId, QuestId, QuestWorkItemId } from '@dungeonmaster/shared/contracts';

import type { OrchestrationProcess } from '../../contracts/orchestration-process/orchestration-process-contract';

const state = {
  processes: new Map<ProcessId, OrchestrationProcess>(),
};

export const orchestrationProcessesState = {
  register: ({ orchestrationProcess }: { orchestrationProcess: OrchestrationProcess }): void => {
    state.processes.set(orchestrationProcess.processId, orchestrationProcess);
  },

  get: ({ processId }: { processId: ProcessId }): OrchestrationProcess | undefined =>
    state.processes.get(processId),

  findByQuestId: ({ questId }: { questId: QuestId }): OrchestrationProcess | undefined => {
    for (const process of state.processes.values()) {
      if (process.questId === questId) {
        return process;
      }
    }
    return undefined;
  },

  findByQuestWorkItemId: ({
    questWorkItemId,
  }: {
    questWorkItemId: QuestWorkItemId;
  }): OrchestrationProcess | undefined => {
    for (const process of state.processes.values()) {
      if (process.questWorkItemId === questWorkItemId) {
        return process;
      }
    }
    return undefined;
  },

  findAllByQuestId: ({ questId }: { questId: QuestId }): OrchestrationProcess[] => {
    const matches: OrchestrationProcess[] = [];
    for (const process of state.processes.values()) {
      if (process.questId === questId) {
        matches.push(process);
      }
    }
    return matches;
  },

  kill: ({ processId }: { processId: ProcessId }): boolean => {
    const entry = state.processes.get(processId);
    if (!entry) return false;
    entry.kill();
    state.processes.delete(processId);
    return true;
  },

  killAll: (): void => {
    for (const [, entry] of state.processes) {
      entry.kill();
    }
    state.processes.clear();
  },

  has: ({ processId }: { processId: ProcessId }): boolean => state.processes.has(processId),

  remove: ({ processId }: { processId: ProcessId }): boolean => state.processes.delete(processId),

  clear: (): void => {
    state.processes.clear();
  },

  getAll: (): ProcessId[] => Array.from(state.processes.keys()),
} as const;
