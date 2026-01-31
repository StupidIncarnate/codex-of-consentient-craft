import { buildTimestampContract } from './build-timestamp-contract';
import type { BuildTimestamp } from './build-timestamp-contract';

export const BuildTimestampStub = ({ value }: { value?: string } = {}): BuildTimestamp =>
  buildTimestampContract.parse(value ?? 'Jan 30 2:45 PM');
