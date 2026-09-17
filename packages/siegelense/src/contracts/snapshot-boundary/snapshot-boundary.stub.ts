import { snapshotBoundaryContract } from './snapshot-boundary-contract';
import type { SnapshotBoundary } from './snapshot-boundary-contract';

export const SnapshotBoundaryStub = (
  { value }: { value: string } = { value: 'start' },
): SnapshotBoundary => snapshotBoundaryContract.parse(value);
