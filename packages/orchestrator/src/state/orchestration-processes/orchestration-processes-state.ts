/**
 * PURPOSE: Manages state for tracking all running processes (orchestration and chat) by processId. Two registration shapes coexist: quest-level loop dispatchers (no `questWorkItemId`) found via `findByQuestId`, and per-agent launcher entries (with `questWorkItemId`) found via `findByQuestWorkItemId` for future per-agent message-injection.
 *
 * Activity telemetry (lastActivityAt + optional osPid + optional sessionJsonlPath) lives in a parallel internal map so the `OrchestrationProcess` contract — read by every consumer of `get` / `findByQuestId` etc. — stays narrow. Read activity via `getActivity({ processId })`.
 *
 * USAGE:
 * orchestrationProcessesState.register({orchestrationProcess});
 * orchestrationProcessesState.recordActivity({processId});
 * orchestrationProcessesState.setMetadata({processId, osPid, sessionJsonlPath});
 * orchestrationProcessesState.getActivity({processId});
 * orchestrationProcessesState.kill({processId});
 * orchestrationProcessesState.killAll();
 * orchestrationProcessesState.findByQuestWorkItemId({questWorkItemId});
 */

import type {
  AbsoluteFilePath,
  ProcessId,
  QuestId,
  QuestWorkItemId,
} from '@dungeonmaster/shared/contracts';

import type { OrchestrationProcess } from '../../contracts/orchestration-process/orchestration-process-contract';
import type { ProcessActivity } from '../../contracts/process-activity/process-activity-contract';
import type { ProcessPid } from '../../contracts/process-pid/process-pid-contract';

const state = {
  processes: new Map<ProcessId, OrchestrationProcess>(),
  activity: new Map<ProcessId, ProcessActivity>(),
};

export const orchestrationProcessesState = {
  register: ({ orchestrationProcess }: { orchestrationProcess: OrchestrationProcess }): void => {
    state.processes.set(orchestrationProcess.processId, orchestrationProcess);
    // Seed activity to "now" so the watchdog has a baseline before any line streams.
    // Preserves osPid / sessionJsonlPath if a prior setMetadata call landed before register.
    const prior = state.activity.get(orchestrationProcess.processId);
    state.activity.set(orchestrationProcess.processId, {
      lastActivityAt: new Date(),
      ...(prior?.osPid !== undefined && { osPid: prior.osPid }),
      ...(prior?.sessionJsonlPath !== undefined && { sessionJsonlPath: prior.sessionJsonlPath }),
    });
  },

  recordActivity: ({ processId }: { processId: ProcessId }): void => {
    const entry = state.activity.get(processId);
    if (entry === undefined) return;
    entry.lastActivityAt = new Date();
  },

  setMetadata: ({
    processId,
    osPid,
    sessionJsonlPath,
  }: {
    processId: ProcessId;
    osPid?: ProcessPid;
    sessionJsonlPath?: AbsoluteFilePath;
  }): void => {
    const entry = state.activity.get(processId);
    if (entry === undefined) return;
    if (osPid !== undefined) entry.osPid = osPid;
    if (sessionJsonlPath !== undefined) entry.sessionJsonlPath = sessionJsonlPath;
  },

  getActivity: ({ processId }: { processId: ProcessId }): ProcessActivity | undefined =>
    state.activity.get(processId),

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
    state.activity.delete(processId);
    return true;
  },

  killAll: (): void => {
    for (const [, entry] of state.processes) {
      entry.kill();
    }
    state.processes.clear();
    state.activity.clear();
  },

  has: ({ processId }: { processId: ProcessId }): boolean => state.processes.has(processId),

  remove: ({ processId }: { processId: ProcessId }): boolean => {
    state.activity.delete(processId);
    return state.processes.delete(processId);
  },

  clear: (): void => {
    state.processes.clear();
    state.activity.clear();
  },

  getAll: (): ProcessId[] => Array.from(state.processes.keys()),
} as const;
