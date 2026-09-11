import { processSignalContract } from './process-signal-contract';
import type { ProcessSignal } from './process-signal-contract';

export const ProcessSignalStub = (
  { value }: { value: string } = { value: 'SIGKILL' },
): ProcessSignal => processSignalContract.parse(value);
