import { stepIndexContract, type StepIndex } from './step-index-contract';

export const StepIndexStub = ({ value }: { value: number } = { value: 1 }): StepIndex =>
  stepIndexContract.parse(value);
