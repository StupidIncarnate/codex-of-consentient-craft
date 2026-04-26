/**
 * PURPOSE: Validates the second argument captured from a Node `child_process.spawn` mock — the
 * `cwd`/`env`/etc. SpawnOptions snapshot inspected by adapter integration tests. Mirrors the
 * subset of fields tests assert on; everything else passes through.
 *
 * USAGE:
 * const opts = spawnOptionsSnapshotContract.parse(proxy.getSpawnedOptions());
 * expect(opts.cwd).toBe('/abs/path');
 */
import { z } from 'zod';

export const spawnOptionsSnapshotContract = z
  .object({
    cwd: z.string().brand<'SpawnOptionsCwd'>().optional(),
    env: z.record(z.string().brand<'SpawnOptionsEnvValue'>()).optional(),
    stdio: z.array(z.string().brand<'SpawnOptionsStdioMode'>()).optional(),
  })
  .passthrough();

export type SpawnOptionsSnapshot = z.infer<typeof spawnOptionsSnapshotContract>;
