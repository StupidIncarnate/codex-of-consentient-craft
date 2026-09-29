import { agentSpawnStreamingResultContract } from './agent-spawn-streaming-result-contract';
import type { AgentSpawnStreamingResult } from './agent-spawn-streaming-result-contract';
import { SessionIdStub } from '@dungeonmaster/shared/contracts/session-id/session-id.stub';
import { ExitCodeStub } from '@dungeonmaster/shared/contracts/exit-code/exit-code.stub';

type StubArgument<T> = {
  [K in keyof T]?: T[K];
};

export const AgentSpawnStreamingResultStub = ({
  ...props
}: StubArgument<AgentSpawnStreamingResult> = {}): AgentSpawnStreamingResult =>
  agentSpawnStreamingResultContract.parse({
    sessionId: SessionIdStub(),
    exitCode: ExitCodeStub({ value: 0 }),
    signal: null,
    crashed: false,
    capturedOutput: [],
    ...props,
  });
