import type { StubArgument } from '@dungeonmaster/shared/@types';
import { needsUserInputSignalContract } from './needs-user-input-signal-contract';
import type { NeedsUserInputSignal } from './needs-user-input-signal-contract';
import { StepIdStub } from '@dungeonmaster/shared/contracts';

export const NeedsUserInputSignalStub = ({
  ...props
}: StubArgument<NeedsUserInputSignal> = {}): NeedsUserInputSignal =>
  needsUserInputSignalContract.parse({
    signal: 'needs-user-input',
    stepId: StepIdStub(),
    question: 'What database should be used?',
    context: 'Setting up data persistence layer',
    ...props,
  });
