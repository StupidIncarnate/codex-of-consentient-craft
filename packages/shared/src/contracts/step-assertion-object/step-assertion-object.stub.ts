import type { StubArgument } from '@dungeonmaster/shared/@types';

import { stepAssertionObjectContract } from './step-assertion-object-contract';
import type { StepAssertionObject } from './step-assertion-object-contract';

export const StepAssertionObjectStub = ({
  ...props
}: StubArgument<StepAssertionObject> = {}): StepAssertionObject =>
  stepAssertionObjectContract.parse({
    prefix: 'VALID',
    input: '{valid input}',
    expected: 'returns expected result',
    ...props,
  });
