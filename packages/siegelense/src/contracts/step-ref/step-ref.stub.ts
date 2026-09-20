import { stepRefContract } from './step-ref-contract';
import type { StepRef } from './step-ref-contract';

export const StepRefStub = ({ value }: { value: string } = { value: '{g.guild.id}' }): StepRef =>
  stepRefContract.parse(value);
