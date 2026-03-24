import { epochTimestampContract, type EpochTimestamp } from './epoch-timestamp-contract';

export const EpochTimestampStub = ({ value }: { value?: number } = {}): EpochTimestamp =>
  epochTimestampContract.parse(value ?? 1700000000000);
