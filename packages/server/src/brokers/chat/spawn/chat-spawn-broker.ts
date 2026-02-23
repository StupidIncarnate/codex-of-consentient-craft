/**
 * PURPOSE: Spawns a Claude CLI process with readline streaming and WebSocket broadcasting of output lines
 *
 * USAGE:
 * const { kill } = chatSpawnBroker({ args, workingDir, clients, chatProcessId, logPrefix });
 * // Spawns CLI, streams stdout lines to WS clients, returns kill handle
 */

import { wsMessageContract } from '@dungeonmaster/shared/contracts';
import type { ProcessId, SessionId } from '@dungeonmaster/shared/contracts';
import {
  isoTimestampContract,
  sessionIdExtractorTransformer,
  streamJsonLineContract,
} from '@dungeonmaster/orchestrator';

import { childProcessSpawnAdapter } from '../../../adapters/child-process/spawn/child-process-spawn-adapter';
import { readlineCreateLineReaderAdapter } from '../../../adapters/readline/create-line-reader/readline-create-line-reader-adapter';
import { processDevLogAdapter } from '../../../adapters/process/dev-log/process-dev-log-adapter';
import { streamLineSummaryTransformer } from '../../../transformers/stream-line-summary/stream-line-summary-transformer';
import { wsEventRelayBroadcastBroker } from '../../ws-event-relay/broadcast/ws-event-relay-broadcast-broker';
import type { WsClient } from '../../../contracts/ws-client/ws-client-contract';

const CLAUDE_CLI_COMMAND = process.env.CLAUDE_CLI_PATH ?? 'claude';

export const chatSpawnBroker = ({
  args,
  workingDir,
  clients,
  chatProcessId,
  logPrefix,
  extractSessionId = false,
  onSessionIdExtracted,
  onExit,
}: {
  args: string[];
  workingDir: string;
  clients: Set<WsClient>;
  chatProcessId: ProcessId;
  logPrefix: string;
  extractSessionId?: boolean;
  onSessionIdExtracted?: (params: { sessionId: SessionId }) => void;
  onExit?: (params: { exitCode: number; extractedSessionId: SessionId | null }) => void;
}): { kill: () => void } => {
  const fullArgs = [...args, '--output-format', 'stream-json', '--verbose'];

  const childProcess = childProcessSpawnAdapter({
    command: CLAUDE_CLI_COMMAND,
    args: fullArgs,
    cwd: workingDir,
  });

  processDevLogAdapter({
    message: `Claude CLI spawned (${logPrefix}): processId=${chatProcessId}, cwd=${workingDir}, args=${JSON.stringify(fullArgs)}`,
  });

  const rl = readlineCreateLineReaderAdapter({
    input: childProcess.stdout as NodeJS.ReadableStream,
  });

  let extractedSessionIdValue: SessionId | null = null;

  rl.on('line', (line) => {
    try {
      const parsed: unknown = JSON.parse(line);

      if (typeof parsed === 'object' && parsed !== null) {
        const summary = streamLineSummaryTransformer({ parsed });
        processDevLogAdapter({
          message: `${logPrefix} chat stream: processId=${chatProcessId}, ${summary}`,
        });
      } else {
        processDevLogAdapter({
          message: `${logPrefix} chat stream: processId=${chatProcessId}, type=non-object`,
        });
      }
    } catch {
      processDevLogAdapter({
        message: `${logPrefix} chat stream: processId=${chatProcessId}, type=unparseable`,
      });
    }

    if (extractSessionId && !extractedSessionIdValue) {
      const lineParseResult = streamJsonLineContract.safeParse(line);

      if (lineParseResult.success) {
        const sid = sessionIdExtractorTransformer({ line: lineParseResult.data });

        if (sid) {
          extractedSessionIdValue = sid;
          processDevLogAdapter({
            message: `Session ID extracted (${logPrefix}): processId=${chatProcessId}, sessionId=${sid}`,
          });
          onSessionIdExtracted?.({ sessionId: sid });
        }
      }
    }

    wsEventRelayBroadcastBroker({
      clients,
      message: wsMessageContract.parse({
        type: 'chat-output',
        payload: { chatProcessId, line },
        timestamp: isoTimestampContract.parse(new Date().toISOString()),
      }),
    });
  });

  childProcess.on('exit', (code) => {
    const exitCode = code ?? 1;
    processDevLogAdapter({
      message: `${logPrefix} chat completed: processId=${chatProcessId}, exitCode=${String(exitCode)}`,
    });
    onExit?.({ exitCode, extractedSessionId: extractedSessionIdValue });
  });

  return {
    kill: (): void => {
      childProcess.kill();
    },
  };
};
