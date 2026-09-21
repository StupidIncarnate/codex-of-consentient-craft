import { stepOutcomeContract } from './step-outcome-contract';
import type { StepOutcome } from './step-outcome-contract';

export const StepOutcomeStub = ({ value }: { value?: StepOutcome } = {}): StepOutcome =>
  stepOutcomeContract.parse(value ?? 'done');
