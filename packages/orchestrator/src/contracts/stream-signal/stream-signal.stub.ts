import { streamSignalContract } from './stream-signal-contract';
import type { StreamSignal } from './stream-signal-contract';
import { StepIdStub } from '@dungeonmaster/shared/contracts';

type StubArgument<T> = {
  [K in keyof T]?: T[K];
};

export const StreamSignalStub = ({ ...props }: StubArgument<StreamSignal> = {}): StreamSignal =>
  streamSignalContract.parse({
    signal: 'complete',
    stepId: StepIdStub(),
    summary: 'Task completed successfully',
    ...props,
  });
