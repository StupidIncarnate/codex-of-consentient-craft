import type { StubArgument } from '@dungeonmaster/shared/@types';

import { lastStepReadingContract } from './last-step-reading-contract';
import type { LastStepReading } from './last-step-reading-contract';

export const LastStepReadingStub = ({
  ...props
}: StubArgument<LastStepReading> = {}): LastStepReading =>
  lastStepReadingContract.parse({
    run: 'run_2',
    step: 7,
    verb: 'click',
    ...props,
  });
