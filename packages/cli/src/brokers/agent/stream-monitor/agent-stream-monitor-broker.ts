/**
 * PURPOSE: Monitors Claude stream-json stdout for session_id, signals, and process completion
 *
 * USAGE:
 * const result = await agentStreamMonitorBroker({
 *   stdout: readableStream,
 *   process: childProcess,
 *   timeoutMs: TimeoutMsStub({ value: 60000 }),
 * });
 * // Returns { sessionId, exitCode, timedOut, signal }
 */

import { exitCodeContract, type ExitCode } from '@dungeonmaster/shared/contracts';
import { readlineCreateInterfaceAdapter } from '../../../adapters/readline/create-interface/readline-create-interface-adapter';
import { timerClearTimeoutAdapter } from '../../../adapters/timer/clear-timeout/timer-clear-timeout-adapter';
import { sessionIdExtractorTransformer } from '../../../transformers/session-id-extractor/session-id-extractor-transformer';
import { signalFromStreamTransformer } from '../../../transformers/signal-from-stream/signal-from-stream-transformer';
import { streamJsonLineContract } from '../../../contracts/stream-json-line/stream-json-line-contract';
import {
  streamMonitorResultContract,
  type StreamMonitorResult,
} from '../../../contracts/stream-monitor-result/stream-monitor-result-contract';
import type { TimeoutMs } from '../../../contracts/timeout-ms/timeout-ms-contract';
import type { EventEmittingProcess } from '../../../contracts/event-emitting-process/event-emitting-process-contract';
import {
  monitorStateContract,
  type MonitorState,
} from '../../../contracts/monitor-state/monitor-state-contract';
import { scheduleTimeoutLayerBroker } from './schedule-timeout-layer-broker';

export const agentStreamMonitorBroker = async ({
  stdout,
  process: childProcess,
  timeoutMs,
}: {
  stdout: Parameters<typeof readlineCreateInterfaceAdapter>[0]['input'];
  process: EventEmittingProcess;
  timeoutMs: TimeoutMs;
}): Promise<StreamMonitorResult> => {
  const state: MonitorState = monitorStateContract.parse({
    sessionId: null,
    signal: null,
    timedOut: false,
    timerId: null,
  });

  const rl = readlineCreateInterfaceAdapter({ input: stdout });

  state.timerId = scheduleTimeoutLayerBroker({
    state,
    childProcess,
    timeoutMs,
  });

  rl.on('line', (rawLine: unknown) => {
    state.timerId = scheduleTimeoutLayerBroker({
      state,
      childProcess,
      timeoutMs,
    });

    const lineResult = streamJsonLineContract.safeParse(rawLine);
    if (!lineResult.success) {
      return;
    }
    const line = lineResult.data;

    if (!state.sessionId) {
      const extractedSessionId = sessionIdExtractorTransformer({ line });
      if (extractedSessionId) {
        state.sessionId = extractedSessionId;
      }
    }

    if (!state.signal) {
      const extractedSignal = signalFromStreamTransformer({ line });
      if (extractedSignal) {
        state.signal = extractedSignal;
      }
    }
  });

  return new Promise((resolve, reject) => {
    childProcess.on('exit', (code: number | null) => {
      if (state.timerId) {
        timerClearTimeoutAdapter({ timerId: state.timerId });
      }
      rl.close();

      const exitCode: ExitCode | null = code === null ? null : exitCodeContract.parse(code);

      resolve(
        streamMonitorResultContract.parse({
          sessionId: state.sessionId,
          exitCode,
          timedOut: state.timedOut,
          signal: state.signal,
        }),
      );
    });

    childProcess.on('error', (error: Error) => {
      if (state.timerId) {
        timerClearTimeoutAdapter({ timerId: state.timerId });
      }
      rl.close();
      reject(error);
    });
  });
};
