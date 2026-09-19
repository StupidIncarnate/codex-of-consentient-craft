import { snapshotNameContract } from './snapshot-name-contract';
import type { SnapshotName } from './snapshot-name-contract';

export const SnapshotNameStub = ({ value }: { value: string } = { value: 'clean' }): SnapshotName =>
  snapshotNameContract.parse(value);
