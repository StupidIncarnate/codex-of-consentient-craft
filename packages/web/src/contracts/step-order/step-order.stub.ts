import { stepOrderContract } from './step-order-contract';
import type { StepOrder } from './step-order-contract';

export const StepOrderStub = ({ value }: { value?: number } = {}): StepOrder =>
  stepOrderContract.parse(value ?? 1);
