/**
 * PURPOSE: Spawns Claude CLI with streaming output and monitors for session ID, signals, and completion
 *
 * USAGE:
 * const result = await agentSpawnStreamingBroker({
 *   prompt: PromptTextStub({ value: 'You are an AI...' }),
 *   stepId: StepIdStub(),
 *   timeoutMs: TimeoutMsStub({ value: 60000 }),
 * });
 * // Returns { sessionId, exitCode, signal, crashed, timedOut }
 */

import type { SessionId, StepId } from '@dungeonmaster/shared/contracts';
import { childProcessSpawnStreamJsonAdapter } from '../../../adapters/child-process/spawn-stream-json/child-process-spawn-stream-json-adapter';
import { agentStreamMonitorBroker } from '../stream-monitor/agent-stream-monitor-broker';
import {
  agentSpawnStreamingResultContract,
  type AgentSpawnStreamingResult,
} from '../../../contracts/agent-spawn-streaming-result/agent-spawn-streaming-result-contract';
import type { PromptText } from '../../../contracts/prompt-text/prompt-text-contract';
import type { TimeoutMs } from '../../../contracts/timeout-ms/timeout-ms-contract';
import type { EventEmittingProcess } from '../../../contracts/event-emitting-process/event-emitting-process-contract';

export const agentSpawnStreamingBroker = async ({
  prompt,
  stepId: _stepId,
  resumeSessionId,
  timeoutMs,
}: {
  prompt: PromptText;
  stepId: StepId;
  resumeSessionId?: SessionId;
  timeoutMs: TimeoutMs;
}): Promise<AgentSpawnStreamingResult> => {
  // Spawn claude with stream-json output format
  const spawnArgs = resumeSessionId ? { prompt, resumeSessionId } : { prompt };
  const { process: childProcess, stdout } = childProcessSpawnStreamJsonAdapter(spawnArgs);

  // Wrap ChildProcess to match EventEmittingProcess interface
  const eventEmittingProcess: EventEmittingProcess = {
    kill: (): boolean => childProcess.kill(),
    on: (...args: unknown[]): unknown =>
      childProcess.on(...(args as Parameters<typeof childProcess.on>)),
  };

  // Monitor the stream for session ID, signals, and wait for exit
  const monitorResult = await agentStreamMonitorBroker({
    stdout,
    process: eventEmittingProcess,
    timeoutMs,
  });

  // Determine if process crashed: exited without signal and exitCode != 0
  const crashed =
    monitorResult.signal === null &&
    monitorResult.exitCode !== null &&
    monitorResult.exitCode !== 0;

  return agentSpawnStreamingResultContract.parse({
    sessionId: monitorResult.sessionId,
    exitCode: monitorResult.exitCode,
    signal: monitorResult.signal,
    crashed,
    timedOut: monitorResult.timedOut,
  });
};
