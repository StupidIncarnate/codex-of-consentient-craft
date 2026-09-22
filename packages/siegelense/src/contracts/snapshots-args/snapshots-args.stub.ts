import type { StubArgument } from '@dungeonmaster/shared/@types';

import { snapshotsArgsContract } from './snapshots-args-contract';
import type { SnapshotsArgs } from './snapshots-args-contract';

export const SnapshotsArgsStub = ({ ...props }: StubArgument<SnapshotsArgs> = {}): SnapshotsArgs =>
  snapshotsArgsContract.parse({
    instanceId: 'inst_7f3a9c21',
    isJson: false,
    ...props,
  });
