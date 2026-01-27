import type { StubArgument } from '@dungeonmaster/shared/@types';
import { partiallyCompleteSignalContract } from './partially-complete-signal-contract';
import type { PartiallyCompleteSignal } from './partially-complete-signal-contract';
import { StepIdStub } from '@dungeonmaster/shared/contracts';

export const PartiallyCompleteSignalStub = ({
  ...props
}: StubArgument<PartiallyCompleteSignal> = {}): PartiallyCompleteSignal =>
  partiallyCompleteSignalContract.parse({
    signal: 'partially-complete',
    stepId: StepIdStub(),
    progress: 'Completed 50% of the task',
    continuationPoint: 'Continue from step 3',
    ...props,
  });
