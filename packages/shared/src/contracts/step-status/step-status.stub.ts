import { stepStatusContract } from './step-status-contract';
import type { StepStatus } from './step-status-contract';

export const StepStatusStub = ({ value }: { value?: StepStatus } = {}): StepStatus =>
  stepStatusContract.parse(value ?? 'pending');
