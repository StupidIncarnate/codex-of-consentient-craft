import type { StubArgument } from '@dungeonmaster/shared/@types';

import { snapshotRecordContract } from './snapshot-record-contract';
import type { SnapshotRecord } from './snapshot-record-contract';

export const SnapshotRecordStub = ({
  ...props
}: StubArgument<SnapshotRecord> = {}): SnapshotRecord =>
  snapshotRecordContract.parse({
    name: 'clean',
    atMs: 1735689600000,
    manual: true,
    path: '/tmp/dm-siege-inst_7f3a9c21/.siegelense-snapshots/1',
    ...props,
  });
