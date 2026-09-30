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

import type { Quest, WorkItem } from '@dungeonmaster/shared/contracts';

import { orchestrationProcessContract } from '../../contracts/orchestration-process/orchestration-process-contract';
import type { OrchestrationProcess } from '../../contracts/orchestration-process/orchestration-process-contract';
import { processActivityContract } from '../../contracts/process-activity/process-activity-contract';
import type { ProcessActivity } from '../../contracts/process-activity/process-activity-contract';

const state = {
  processes: new Map<string, OrchestrationProcess>(),
  activity: new Map<string, ProcessActivity>(),
};

export const orchestrationProcessesState = {
  register: ({ orchestrationProcess }: { orchestrationProcess: OrchestrationProcess }): void => {
    // `kill` is a function the schema cannot check, so it is re-attached beside the parsed data.
    const registered: OrchestrationProcess = {
      ...orchestrationProcessContract.parse(orchestrationProcess),
      kill: orchestrationProcess.kill,
    };
    state.processes.set(registered.processId, registered);
    // Seed activity to "now" so the watchdog has a baseline before any line streams.
    // Preserves osPid / sessionJsonlPath if a prior setMetadata call landed before register.
    const prior = state.activity.get(registered.processId);
    state.activity.set(
      registered.processId,
      processActivityContract.parse({
        lastActivityAt: new Date(),
        ...(prior?.osPid !== undefined && { osPid: prior.osPid }),
        ...(prior?.sessionJsonlPath !== undefined && { sessionJsonlPath: prior.sessionJsonlPath }),
      }),
    );
  },

  recordActivity: ({ processId }: { processId: string }): void => {
    const entry = state.activity.get(processId);
    if (entry === undefined) return;
    entry.lastActivityAt = new Date();
  },

  setMetadata: ({
    processId,
    osPid,
    sessionJsonlPath,
  }: {
    processId: string;
    osPid?: number;
    sessionJsonlPath?: string;
  }): void => {
    const entry = state.activity.get(processId);
    if (entry === undefined) return;
    state.activity.set(
      processId,
      processActivityContract.parse({
        ...entry,
        ...(osPid !== undefined && { osPid }),
        ...(sessionJsonlPath !== undefined && { sessionJsonlPath }),
      }),
    );
  },

  getActivity: ({ processId }: { processId: string }): ProcessActivity | undefined =>
    state.activity.get(processId),

  get: ({ processId }: { processId: string }): OrchestrationProcess | undefined =>
    state.processes.get(processId),

  findByQuestId: ({ questId }: { questId: Quest['id'] }): OrchestrationProcess | undefined => {
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
    questWorkItemId: WorkItem['id'];
  }): OrchestrationProcess | undefined => {
    for (const process of state.processes.values()) {
      if (process.questWorkItemId === questWorkItemId) {
        return process;
      }
    }
    return undefined;
  },

  findAllByQuestId: ({ questId }: { questId: Quest['id'] }): OrchestrationProcess[] => {
    const matches: OrchestrationProcess[] = [];
    for (const process of state.processes.values()) {
      if (process.questId === questId) {
        matches.push(process);
      }
    }
    return matches;
  },

  kill: ({ processId }: { processId: string }): boolean => {
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

  has: ({ processId }: { processId: string }): boolean => state.processes.has(processId),

  remove: ({ processId }: { processId: string }): boolean => {
    state.activity.delete(processId);
    return state.processes.delete(processId);
  },

  clear: (): void => {
    state.processes.clear();
    state.activity.clear();
  },

  getAll: (): string[] => Array.from(state.processes.keys()),
} as const;
