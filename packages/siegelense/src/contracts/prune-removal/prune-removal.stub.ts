import type { StubArgument } from '@dungeonmaster/shared/@types';

import { InstanceIdStub } from '../instance-id/instance-id.stub';
import { pruneRemovalContract } from './prune-removal-contract';
import type { PruneRemoval } from './prune-removal-contract';

export const PruneRemovalStub = ({ ...props }: StubArgument<PruneRemoval> = {}): PruneRemoval =>
  pruneRemovalContract.parse({
    id: InstanceIdStub({ value: 'inst_9b2c' }),
    kind: null,
    freedBytes: 4_299_161_600,
    freedMB: 4100,
    tombstoned: true,
    ...props,
  });
