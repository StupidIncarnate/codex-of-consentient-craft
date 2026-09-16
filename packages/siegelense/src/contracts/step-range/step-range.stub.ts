import { stepRangeContract } from './step-range-contract';
import type { StepRange } from './step-range-contract';

export const StepRangeStub = ({ value }: { value: string } = { value: '4-9' }): StepRange =>
  stepRangeContract.parse(value);
