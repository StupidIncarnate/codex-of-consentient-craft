import { spawnPromise } from './spawn-promise';

export const ProcessUtil = {
  spawnPromise,
};

// Re-export types for backward compatibility
export type { SpawnResult } from './spawn-promise';
