import { stepNameContract } from './step-name-contract';
import type { StepName } from './step-name-contract';

export const StepNameStub = ({ value }: { value: string } = { value: 'work' }): StepName =>
  stepNameContract.parse(value);
