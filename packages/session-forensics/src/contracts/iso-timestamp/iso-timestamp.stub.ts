import { isoTimestampContract, type IsoTimestamp } from './iso-timestamp-contract';

export const IsoTimestampStub = (
  { value }: { value: string } = { value: '2026-09-01T19:09:06.542Z' },
): IsoTimestamp => isoTimestampContract.parse(value);
