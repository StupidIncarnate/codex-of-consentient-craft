import { stepAssertionIdContract } from './step-assertion-id-contract';
import type { StepAssertionId } from './step-assertion-id-contract';

export const StepAssertionIdStub = (
  { value }: { value: string } = { value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' },
): StepAssertionId => stepAssertionIdContract.parse(value);
