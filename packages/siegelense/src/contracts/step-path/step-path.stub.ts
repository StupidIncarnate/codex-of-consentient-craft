import { stepPathContract } from './step-path-contract';
import type { StepPath } from './step-path-contract';

export const StepPathStub = ({ value }: { value: string } = { value: '/' }): StepPath =>
  stepPathContract.parse(value);
