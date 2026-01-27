import { streamMonitorResultContract } from './stream-monitor-result-contract';
import type { StreamMonitorResult } from './stream-monitor-result-contract';
import { SessionIdStub, ExitCodeStub } from '@dungeonmaster/shared/contracts';

type StubArgument<T> = {
  [K in keyof T]?: T[K];
};

export const StreamMonitorResultStub = ({
  ...props
}: StubArgument<StreamMonitorResult> = {}): StreamMonitorResult =>
  streamMonitorResultContract.parse({
    sessionId: SessionIdStub(),
    exitCode: ExitCodeStub({ value: 0 }),
    timedOut: false,
    signal: null,
    ...props,
  });
