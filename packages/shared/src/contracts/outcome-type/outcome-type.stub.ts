import { outcomeTypeContract } from './outcome-type-contract';
import type { OutcomeType } from './outcome-type-contract';

export const OutcomeTypeStub = (
  { value }: { value: string } = { value: 'api-call' },
): OutcomeType => outcomeTypeContract.parse(value);
