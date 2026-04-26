/**
 * PURPOSE: Validates a captured Node `child_process.spawn` options snapshot via the
 * `spawnOptionsSnapshotContract`, returning a typed `SpawnOptionsSnapshot` with `cwd`/`env`
 * narrowed for assertion. Returns an empty snapshot when validation fails so callers can
 * still assert `cwd === undefined` paths.
 *
 * USAGE:
 * const snap = spawnedOptionsSnapshotTransformer({ rawOptions: proxy.getSpawnedOptions() });
 * expect(snap.cwd).toBe('/abs/path');
 */
import {
  spawnOptionsSnapshotContract,
  type SpawnOptionsSnapshot,
} from '../../contracts/spawn-options-snapshot/spawn-options-snapshot-contract';

export const spawnedOptionsSnapshotTransformer = ({
  rawOptions,
}: {
  rawOptions: unknown;
}): SpawnOptionsSnapshot => {
  const parsed = spawnOptionsSnapshotContract.safeParse(rawOptions);
  if (!parsed.success) return spawnOptionsSnapshotContract.parse({});
  return parsed.data;
};
