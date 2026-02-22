import type { StubArgument } from '@dungeonmaster/shared/@types';
import { completeSignalContract } from './complete-signal-contract';
import type { CompleteSignal } from './complete-signal-contract';
import { StepIdStub } from '@dungeonmaster/shared/contracts';

export const CompleteSignalStub = ({
  ...props
}: StubArgument<CompleteSignal> = {}): CompleteSignal =>
  completeSignalContract.parse({
    signal: 'complete',
    stepId: StepIdStub(),
    summary: 'Step completed successfully',
    ...props,
  });
