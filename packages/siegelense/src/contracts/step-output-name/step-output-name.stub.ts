import { stepOutputNameContract } from './step-output-name-contract';
import type { StepOutputName } from './step-output-name-contract';

export const StepOutputNameStub = ({ value }: { value: string } = { value: 'g' }): StepOutputName =>
  stepOutputNameContract.parse(value);
