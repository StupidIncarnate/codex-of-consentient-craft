/**
 * PURPOSE: Monitors Claude stream-json output with tee behavior - displays text to user AND extracts signals
 *
 * USAGE:
 * const result = await teeOutputLayerBroker({
 *   stdout: readableStream,
 *   process: eventEmittingProcess,
 * });
 * // Returns { sessionId, signal, exitCode } after process exits
 * // For needs-user-input signal: returns early with { kill } function to terminate process
 */

import { exitCodeContract, type ExitCode } from '@dungeonmaster/shared/contracts';

import { readlineCreateInterfaceAdapter } from '../../../adapters/readline/create-interface/readline-create-interface-adapter';
import { sessionIdExtractorTransformer } from '../../../transformers/session-id-extractor/session-id-extractor-transformer';
import { signalFromStreamTransformer } from '../../../transformers/signal-from-stream/signal-from-stream-transformer';
import { streamJsonToTextTransformer } from '../../../transformers/stream-json-to-text/stream-json-to-text-transformer';
import { streamJsonToToolUseTransformer } from '../../../transformers/stream-json-to-tool-use/stream-json-to-tool-use-transformer';
import { streamJsonLineContract } from '../../../contracts/stream-json-line/stream-json-line-contract';
import type { EventEmittingProcess } from '../../../contracts/event-emitting-process/event-emitting-process-contract';
import {
  teeOutputResultContract,
  type TeeOutputResult,
} from '../../../contracts/tee-output-result/tee-output-result-contract';
import type { TeeOutputState } from '../../../contracts/tee-output-state/tee-output-state-contract';

export type TeeOutputLayerResult = TeeOutputResult & {
  kill?: () => boolean;
};

export const teeOutputLayerBroker = async ({
  stdout,
  process: childProcess,
}: {
  stdout: Parameters<typeof readlineCreateInterfaceAdapter>[0]['input'];
  process: EventEmittingProcess;
}): Promise<TeeOutputLayerResult> => {
  const state: TeeOutputState = {
    sessionId: null,
    signal: null,
    lastOutputEndedWithNewline: true,
  };

  const rl = readlineCreateInterfaceAdapter({ input: stdout });

  // Track whether we've already resolved to avoid double-resolution
  const resolveState = { resolved: false };

  return new Promise((resolve, reject) => {
    rl.on('line', (rawLine: unknown) => {
      // Skip processing if already resolved
      if (resolveState.resolved) {
        return;
      }

      const lineResult = streamJsonLineContract.safeParse(rawLine);
      if (!lineResult.success) {
        return;
      }
      const line = lineResult.data;

      // Extract session ID if not yet found
      if (state.sessionId === null) {
        const extractedSessionId = sessionIdExtractorTransformer({ line });
        if (extractedSessionId !== null) {
          state.sessionId = extractedSessionId;
        }
      }

      // Extract signal if not yet found
      if (state.signal === null) {
        const extractedSignal = signalFromStreamTransformer({ line });
        if (extractedSignal !== null) {
          state.signal = extractedSignal;

          // For needs-user-input signal, resolve early with kill function
          if (extractedSignal.signal === 'needs-user-input') {
            resolveState.resolved = true;
            resolve({
              ...teeOutputResultContract.parse({
                sessionId: state.sessionId,
                signal: state.signal,
                exitCode: null,
              }),
              kill: () => childProcess.kill(),
            });
            return;
          }
        }
      }

      // Tee: Extract text and display to user
      const text = streamJsonToTextTransformer({ line });
      if (text !== null) {
        process.stdout.write(text);
        state.lastOutputEndedWithNewline = text.endsWith('\n');
      }

      // Tee: Extract tool_use and display to user
      const toolUse = streamJsonToToolUseTransformer({ line });
      if (toolUse !== null) {
        // Prepend newline if previous output didn't end with one
        if (!state.lastOutputEndedWithNewline) {
          process.stdout.write('\n');
        }
        process.stdout.write(toolUse);
        state.lastOutputEndedWithNewline = true;
      }
    });

    childProcess.on('exit', (code: number | null) => {
      // Skip if already resolved
      if (resolveState.resolved) {
        rl.close();
        return;
      }

      rl.close();

      const exitCode: ExitCode | null = code === null ? null : exitCodeContract.parse(code);

      resolve(
        teeOutputResultContract.parse({
          sessionId: state.sessionId,
          signal: state.signal,
          exitCode,
        }),
      );
    });

    childProcess.on('error', (error: Error) => {
      // Skip if already resolved
      if (resolveState.resolved) {
        rl.close();
        return;
      }

      rl.close();
      reject(error);
    });
  });
};
