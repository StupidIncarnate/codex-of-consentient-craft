import type { StubArgument } from '@dungeonmaster/shared/@types';
import { chaoswhispererStreamingResultContract } from './chaoswhisperer-streaming-result-contract';
import type { ChaoswhispererStreamingResult } from './chaoswhisperer-streaming-result-contract';
import { SessionIdStub, ExitCodeStub } from '@dungeonmaster/shared/contracts';
import { StreamSignalStub } from '../stream-signal/stream-signal.stub';

export const ChaoswhispererStreamingResultStub = ({
  ...props
}: StubArgument<ChaoswhispererStreamingResult> = {}): ChaoswhispererStreamingResult =>
  chaoswhispererStreamingResultContract.parse({
    sessionId: SessionIdStub(),
    signal: StreamSignalStub(),
    exitCode: ExitCodeStub(),
    ...props,
  });
