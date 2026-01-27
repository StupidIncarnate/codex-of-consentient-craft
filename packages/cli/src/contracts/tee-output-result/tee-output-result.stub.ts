import type { StubArgument } from '@dungeonmaster/shared/@types';
import { teeOutputResultContract } from './tee-output-result-contract';
import type { TeeOutputResult } from './tee-output-result-contract';
import { SessionIdStub, ExitCodeStub } from '@dungeonmaster/shared/contracts';
import { StreamSignalStub } from '../stream-signal/stream-signal.stub';

export const TeeOutputResultStub = ({
  ...props
}: StubArgument<TeeOutputResult> = {}): TeeOutputResult =>
  teeOutputResultContract.parse({
    sessionId: SessionIdStub(),
    signal: StreamSignalStub(),
    exitCode: ExitCodeStub(),
    ...props,
  });
