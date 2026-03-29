import { elapsedMsContract } from './elapsed-ms-contract';
import type { ElapsedMs } from './elapsed-ms-contract';

export const ElapsedMsStub = ({ value }: { value: number } = { value: 0 }): ElapsedMs =>
  elapsedMsContract.parse(value);
