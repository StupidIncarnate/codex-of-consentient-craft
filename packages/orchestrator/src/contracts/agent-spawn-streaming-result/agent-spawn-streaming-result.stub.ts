import { agentSpawnStreamingResultContract } from './agent-spawn-streaming-result-contract';
import type { AgentSpawnStreamingResult } from './agent-spawn-streaming-result-contract';
import { SessionIdStub, ExitCodeStub } from '@dungeonmaster/shared/contracts';

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
    timedOut: false,
    capturedOutput: [],
    ...props,
  });
