import type { StubArgument } from '@dungeonmaster/shared/@types';

import { stepAssertionContract } from './step-assertion-contract';
import type { StepAssertion } from './step-assertion-contract';

export const StepAssertionStub = ({ ...props }: StubArgument<StepAssertion> = {}): StepAssertion =>
  stepAssertionContract.parse({
    prefix: 'VALID',
    input: '{valid input}',
    expected: 'returns expected result',
    ...props,
  });
