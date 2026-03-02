import { isoTimestampContract } from './iso-timestamp-contract';
import type { IsoTimestamp } from './iso-timestamp-contract';

export const IsoTimestampStub = ({ value }: { value?: string } = {}): IsoTimestamp =>
  isoTimestampContract.parse(value ?? new Date().toISOString());
