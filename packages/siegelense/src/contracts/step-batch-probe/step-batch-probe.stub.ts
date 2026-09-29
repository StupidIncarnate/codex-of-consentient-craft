import { stepBatchProbeContract } from './step-batch-probe-contract';
import type { StepBatchProbe } from './step-batch-probe-contract';

export const StepBatchProbeStub = ({ value }: { value?: unknown } = {}): StepBatchProbe =>
  stepBatchProbeContract.parse(value ?? [{ step: 'goto', path: '/' }]);
