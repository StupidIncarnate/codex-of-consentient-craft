import type { StubArgument } from '@dungeonmaster/shared/@types';

import { spawnOptionsSnapshotContract } from './spawn-options-snapshot-contract';
import type { SpawnOptionsSnapshot } from './spawn-options-snapshot-contract';

/**
 * Default spawn-options snapshot — empty env + no cwd. Tests override via props.
 */
export const SpawnOptionsSnapshotStub = ({
  ...props
}: StubArgument<SpawnOptionsSnapshot> = {}): SpawnOptionsSnapshot =>
  spawnOptionsSnapshotContract.parse({
    env: {},
    ...props,
  });
