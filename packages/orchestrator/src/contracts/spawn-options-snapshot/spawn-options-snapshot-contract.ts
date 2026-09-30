/**
 * PURPOSE: Validates the second argument captured from a Node `child_process.spawn` mock — the
 * `cwd`/`env`/etc. SpawnOptions snapshot inspected by adapter integration tests. Mirrors the
 * subset of fields tests assert on; everything else passes through.
 *
 * USAGE:
 * const opts = spawnOptionsSnapshotContract.parse(proxy.getSpawnedOptions());
 * expect(opts.cwd).toBe('/abs/path');
 */
import { z } from '#gateway/npm/zod';


export const spawnOptionsSnapshotContract = z
  .object({
    cwd: z.string().brand<'SpawnOptionsSnapshotCwd'>().optional(),
    env: z
      .record(z.string(), z.string().brand<'SpawnOptionsSnapshotEnv'>())
      .optional(),
    stdio: z.array(z.string().brand<'SpawnOptionsSnapshotStdio'>()).optional(),
  })
  .loose().brand<'SpawnOptionsSnapshot'>();

export type SpawnOptionsSnapshot = z.infer<typeof spawnOptionsSnapshotContract>;
