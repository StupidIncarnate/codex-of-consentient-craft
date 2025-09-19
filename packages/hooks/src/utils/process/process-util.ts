import { processUtilSpawnPromise } from './process-util-spawn-promise';

export const ProcessUtil = {
  spawnPromise: processUtilSpawnPromise,
};

// Re-export types for backward compatibility
export type { SpawnResult } from './process-util-spawn-promise';
