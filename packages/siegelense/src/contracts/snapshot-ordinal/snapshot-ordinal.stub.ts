import { snapshotOrdinalContract } from './snapshot-ordinal-contract';
import type { SnapshotOrdinal } from './snapshot-ordinal-contract';

export const SnapshotOrdinalStub = ({ value }: { value: number } = { value: 1 }): SnapshotOrdinal =>
  snapshotOrdinalContract.parse(value);
