/**
 * PURPOSE: Tracks active Claude CLI chat processes for lifecycle management and cleanup
 *
 * USAGE:
 * chatProcessState.register({processId, kill: () => childProcess.kill()});
 * chatProcessState.kill({processId});
 * chatProcessState.killAll();
 * // Manages active chat process handles for stop/shutdown cleanup
 */

import type { ProcessId } from '@dungeonmaster/shared/contracts';

const processes = new Map<ProcessId, { kill: () => void }>();

export const chatProcessState = {
  register: ({ processId, kill }: { processId: ProcessId; kill: () => void }): void => {
    processes.set(processId, { kill });
  },

  kill: ({ processId }: { processId: ProcessId }): boolean => {
    const entry = processes.get(processId);
    if (!entry) return false;
    entry.kill();
    processes.delete(processId);
    return true;
  },

  remove: ({ processId }: { processId: ProcessId }): void => {
    processes.delete(processId);
  },

  killAll: (): void => {
    for (const [, entry] of processes) {
      entry.kill();
    }
    processes.clear();
  },

  has: ({ processId }: { processId: ProcessId }): boolean => processes.has(processId),

  clear: (): void => {
    processes.clear();
  },
} as const;
