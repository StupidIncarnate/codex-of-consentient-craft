import type { StubArgument } from '@dungeonmaster/shared/@types';

import { nextStepContract } from './next-step-contract';
import type { NextStep } from './next-step-contract';

export const NextStepStub = ({ ...props }: StubArgument<NextStep> = {}): NextStep =>
  nextStepContract.parse({
    type: 'idle',
    ...props,
  });
