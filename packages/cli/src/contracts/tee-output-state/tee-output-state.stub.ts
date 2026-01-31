import type { StubArgument } from '@dungeonmaster/shared/@types';
import { teeOutputStateContract } from './tee-output-state-contract';
import type { TeeOutputState } from './tee-output-state-contract';
import { SessionIdStub } from '@dungeonmaster/shared/contracts';
import { StreamSignalStub } from '../stream-signal/stream-signal.stub';

export const TeeOutputStateStub = ({ ...props }: StubArgument<TeeOutputState> = {}): TeeOutputState =>
  teeOutputStateContract.parse({
    sessionId: SessionIdStub(),
    signal: StreamSignalStub(),
    lastOutputEndedWithNewline: true,
    ...props,
  });
