/**
 * PURPOSE: Monitors Claude stream-json output with tee behavior - displays text to user AND extracts signals
 *
 * USAGE:
 * const result = await teeOutputLayerBroker({
 *   stdout: readableStream,
 *   process: eventEmittingProcess,
 * });
 * // Returns { sessionId, signal, exitCode } after process exits
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

export const teeOutputLayerBroker = async ({
  stdout,
  process: childProcess,
}: {
  stdout: Parameters<typeof readlineCreateInterfaceAdapter>[0]['input'];
  process: EventEmittingProcess;
}): Promise<TeeOutputResult> => {
  const state: TeeOutputState = {
    sessionId: null,
    signal: null,
  };

  const rl = readlineCreateInterfaceAdapter({ input: stdout });

  rl.on('line', (rawLine: unknown) => {
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
      }
    }

    // Tee: Extract text and display to user
    const text = streamJsonToTextTransformer({ line });
    if (text !== null) {
      process.stdout.write(text);
    }

    // Tee: Extract tool_use and display to user
    const toolUse = streamJsonToToolUseTransformer({ line });
    if (toolUse !== null) {
      process.stdout.write(toolUse);
    }
  });

  return new Promise((resolve, reject) => {
    childProcess.on('exit', (code: number | null) => {
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
      rl.close();
      reject(error);
    });
  });
};
