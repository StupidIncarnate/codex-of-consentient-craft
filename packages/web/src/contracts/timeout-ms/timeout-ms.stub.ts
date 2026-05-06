import { timeoutMsContract } from './timeout-ms-contract';
import type { TimeoutMs } from './timeout-ms-contract';

export const TimeoutMsStub = ({ value = 30000 }: { value?: number } = {}): TimeoutMs =>
  timeoutMsContract.parse(value);
