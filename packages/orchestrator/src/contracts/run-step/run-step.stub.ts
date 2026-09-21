import type { StubArgument } from '@dungeonmaster/shared/@types';

import { runStepContract } from './run-step-contract';
import type { RunStep } from './run-step-contract';

export const RunStepStub = ({ ...props }: StubArgument<RunStep> = {}): RunStep =>
  runStepContract.parse({
    type: 'run-step',
    questId: 'add-auth',
    workItemId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    handler: 'commit',
    args: [],
    ...props,
  });
