import { timeoutMsContract } from './timeout-ms-contract';
import type { TimeoutMs } from './timeout-ms-contract';

export const TimeoutMsStub = ({ value }: { value: number } = { value: 60000 }): TimeoutMs =>
  timeoutMsContract.parse(value);
