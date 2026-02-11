/**
 * PURPOSE: Monitors a spawned agent's stdout stream for signals and session IDs
 *
 * USAGE:
 * const result = await agentStreamMonitorBroker({
 *   stdout: spawnResult.stdout,
 *   process: spawnResult.process,
 *   timeoutMs: TimeoutMsStub({ value: 60000 }),
 * });
 * // Returns { sessionId, exitCode, signal, crashed, timedOut }
 */

import { exitCodeContract, type SessionId } from '@dungeonmaster/shared/contracts';

import { readlineCreateInterfaceAdapter } from '../../../adapters/readline/create-interface/readline-create-interface-adapter';
import {
  agentSpawnStreamingResultContract,
  type AgentSpawnStreamingResult,
} from '../../../contracts/agent-spawn-streaming-result/agent-spawn-streaming-result-contract';
import type { MonitorableProcess } from '../../../contracts/monitorable-process/monitorable-process-contract';
import { streamJsonLineContract } from '../../../contracts/stream-json-line/stream-json-line-contract';
import type { StreamSignal } from '../../../contracts/stream-signal/stream-signal-contract';
import type { TimeoutMs } from '../../../contracts/timeout-ms/timeout-ms-contract';
import { sessionIdExtractorTransformer } from '../../../transformers/session-id-extractor/session-id-extractor-transformer';
import { signalFromStreamTransformer } from '../../../transformers/signal-from-stream/signal-from-stream-transformer';

export const agentStreamMonitorBroker = async ({
  stdout,
  process: childProcess,
  timeoutMs,
}: {
  stdout: Parameters<typeof readlineCreateInterfaceAdapter>[0]['input'];
  process: MonitorableProcess;
  timeoutMs: TimeoutMs;
}): Promise<AgentSpawnStreamingResult> => {
  let lastSignal: StreamSignal | null = null;
  let trackedSessionId: SessionId | null = null;
  let timedOut = false;

  const rl = readlineCreateInterfaceAdapter({ input: stdout });

  rl.onLine(({ line }) => {
    const parseResult = streamJsonLineContract.safeParse(line);
    if (!parseResult.success) {
      return;
    }
    const parsedLine = parseResult.data;

    const signal = signalFromStreamTransformer({ line: parsedLine });
    if (signal !== null) {
      lastSignal = signal;
    }

    if (trackedSessionId === null) {
      const sessionId = sessionIdExtractorTransformer({ line: parsedLine });
      if (sessionId !== null) {
        trackedSessionId = sessionId;
      }
    }
  });

  const timeoutHandle = setTimeout(() => {
    timedOut = true;
    childProcess.kill();
  }, timeoutMs);

  return new Promise<AgentSpawnStreamingResult>((resolve) => {
    childProcess.on('exit', (code) => {
      clearTimeout(timeoutHandle);
      rl.close();

      const exitCode = code === null ? null : exitCodeContract.parse(code);
      const crashed = exitCode !== null && exitCode !== 0 && !timedOut;

      resolve(
        agentSpawnStreamingResultContract.parse({
          sessionId: trackedSessionId,
          exitCode,
          signal: lastSignal,
          crashed,
          timedOut,
        }),
      );
    });
  });
};
