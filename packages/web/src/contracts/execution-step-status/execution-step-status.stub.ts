import { executionStepStatusContract } from './execution-step-status-contract';
import type { ExecutionStepStatus } from './execution-step-status-contract';

export const ExecutionStepStatusStub = ({ value }: { value?: string } = {}): ExecutionStepStatus =>
  executionStepStatusContract.parse(value ?? 'pending');
