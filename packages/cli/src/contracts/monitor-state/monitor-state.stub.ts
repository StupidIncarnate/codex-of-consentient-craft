import { monitorStateContract } from './monitor-state-contract';
import type { MonitorState } from './monitor-state-contract';

type StubArgument<T> = {
  [K in keyof T]?: T[K];
};

export const MonitorStateStub = ({ ...props }: StubArgument<MonitorState> = {}): MonitorState =>
  monitorStateContract.parse({
    sessionId: null,
    signal: null,
    timedOut: false,
    timerId: null,
    ...props,
  });
