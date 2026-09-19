import type { StubArgument } from '@dungeonmaster/shared/@types';

import { FileSizeBytesStub } from '../file-size-bytes/file-size-bytes.stub';
import { InstanceIdStub } from '../instance-id/instance-id.stub';
import { MegabytesStub } from '../megabytes/megabytes.stub';
import { pruneRemovalContract } from './prune-removal-contract';
import type { PruneRemoval } from './prune-removal-contract';

export const PruneRemovalStub = ({ ...props }: StubArgument<PruneRemoval> = {}): PruneRemoval =>
  pruneRemovalContract.parse({
    id: InstanceIdStub({ value: 'inst_9b2c' }),
    kind: null,
    freedBytes: FileSizeBytesStub({ value: 4_299_161_600 }),
    freedMB: MegabytesStub({ value: 4100 }),
    tombstoned: true,
    ...props,
  });
