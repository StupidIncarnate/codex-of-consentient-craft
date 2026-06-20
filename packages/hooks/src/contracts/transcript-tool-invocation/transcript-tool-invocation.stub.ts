import type { TranscriptToolInvocation } from './transcript-tool-invocation-contract';
import { transcriptToolInvocationContract } from './transcript-tool-invocation-contract';
import type { StubArgument } from '@dungeonmaster/shared/@types';

export const TranscriptToolInvocationStub = ({
  ...props
}: StubArgument<TranscriptToolInvocation> = {}): TranscriptToolInvocation =>
  transcriptToolInvocationContract.parse({
    name: 'mcp__dungeonmaster__signal-back',
    workItemId: null,
    ...props,
  });
