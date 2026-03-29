import { processPidContract } from './process-pid-contract';
import type { ProcessPid } from './process-pid-contract';

export const ProcessPidStub = ({ value }: { value: number } = { value: 1234 }): ProcessPid =>
  processPidContract.parse(value);
