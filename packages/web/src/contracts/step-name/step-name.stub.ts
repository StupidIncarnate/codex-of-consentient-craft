import { stepNameContract } from './step-name-contract';
import type { StepName } from './step-name-contract';

export const StepNameStub = ({ value }: { value?: string } = {}): StepName =>
  stepNameContract.parse(value ?? 'Build user auth flow');
