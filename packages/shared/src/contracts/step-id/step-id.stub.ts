import { stepIdContract } from './step-id-contract';
import type { StepId } from './step-id-contract';

export const StepIdStub = (
  { value }: { value: string } = { value: 'e5f6a7b8-c9d0-4e1f-a2b3-4c5d6e7f8a9b' },
): StepId => stepIdContract.parse(value);
