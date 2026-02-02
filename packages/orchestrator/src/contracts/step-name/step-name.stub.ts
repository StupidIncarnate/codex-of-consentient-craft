import { stepNameContract } from './step-name-contract';
import type { StepName } from './step-name-contract';

export const StepNameStub = (
  { value }: { value: string } = { value: 'implement-auth-middleware' },
): StepName => stepNameContract.parse(value);
