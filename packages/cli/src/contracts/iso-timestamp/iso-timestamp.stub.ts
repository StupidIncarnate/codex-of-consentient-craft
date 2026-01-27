import { isoTimestampContract } from './iso-timestamp-contract';
import type { IsoTimestamp } from './iso-timestamp-contract';

export const IsoTimestampStub = ({ value }: { value?: string } = {}): IsoTimestamp =>
  isoTimestampContract.parse(value ?? '2024-01-15T10:00:00.000Z');
