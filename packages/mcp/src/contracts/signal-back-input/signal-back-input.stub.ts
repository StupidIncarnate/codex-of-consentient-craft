import type { StubArgument } from '@dungeonmaster/shared/@types';
import { signalBackInputContract } from './signal-back-input-contract';
import type { SignalBackInput } from './signal-back-input-contract';
import { StepIdStub } from '@dungeonmaster/shared/contracts';

export const SignalBackInputStub = ({
  ...props
}: StubArgument<SignalBackInput> = {}): SignalBackInput => {
  const signal = props.signal ?? 'complete';
  const baseProps = {
    signal,
    stepId: props.stepId ?? StepIdStub(),
  };

  if (signal === 'complete') {
    return signalBackInputContract.parse({
      ...baseProps,
      summary: 'Step completed successfully',
      ...props,
    });
  }

  if (signal === 'partially-complete') {
    return signalBackInputContract.parse({
      ...baseProps,
      progress: 'Completed 50% of the task',
      continuationPoint: 'Continue from step 3',
      ...props,
    });
  }

  return signalBackInputContract.parse({
    ...baseProps,
    targetRole: 'test-writer',
    reason: 'Need test coverage for new feature',
    context: 'Implementation complete, tests needed',
    resume: true,
    ...props,
  });
};
