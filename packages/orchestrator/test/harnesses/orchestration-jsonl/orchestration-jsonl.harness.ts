/**
 * PURPOSE: Provides JSONL line builder helpers for constructing Claude CLI output shapes in integration tests
 *
 * USAGE:
 * const jsonl = orchestrationJsonlHarness();
 * const response = jsonl.agentSuccessResponse({ sessionId: SessionIdStub({ value: 'sess-001' }) });
 * queue.enqueue({ queueDir, response });
 */
import type { FilePathStub } from '@dungeonmaster/shared/contracts';
import {
  ExitCodeStub,
  ResultStreamLineStub,
  SessionIdStub,
  SystemInitStreamLineStub,
} from '@dungeonmaster/shared/contracts';

import type { ClaudeQueueResponseStub } from '../../../src/contracts/claude-queue-response/claude-queue-response.stub';
import { StreamJsonLineStub } from '../../../src/contracts/stream-json-line/stream-json-line.stub';
import type { WardQueueResponseStub } from '../../../src/contracts/ward-queue-response/ward-queue-response.stub';
import { WardRunIdStub } from '../../../src/contracts/ward-run-id/ward-run-id.stub';

type ClaudeQueueResponse = ReturnType<typeof ClaudeQueueResponseStub>;
type WardQueueResponse = ReturnType<typeof WardQueueResponseStub>;

export const orchestrationJsonlHarness = (): {
  signalBackLine: (params: {
    signal: 'complete' | 'failed';
    summary?: string;
  }) => ReturnType<typeof StreamJsonLineStub>;
  agentSuccessResponse: (params?: {
    sessionId?: ClaudeQueueResponse['sessionId'];
  }) => ClaudeQueueResponse;
  agentFailedResponse: (params?: {
    sessionId?: ClaudeQueueResponse['sessionId'];
    summary?: string;
    exitCode?: ReturnType<typeof ExitCodeStub>;
  }) => ClaudeQueueResponse;
  wardPassResponse: () => WardQueueResponse;
  wardFailResponse: (params?: {
    filePaths?: ReturnType<typeof FilePathStub>[];
  }) => WardQueueResponse;
} => {
  const signalBackLine = ({
    signal,
    summary,
  }: {
    signal: 'complete' | 'failed';
    summary?: string;
  }): ReturnType<typeof StreamJsonLineStub> =>
    StreamJsonLineStub({
      value: JSON.stringify({
        type: 'assistant',
        message: {
          content: [
            {
              type: 'tool_use',
              name: 'mcp__dungeonmaster__signal-back',
              input: { signal, ...(summary === undefined ? {} : { summary }) },
            },
          ],
        },
      }),
    });

  const agentSuccessResponse = ({
    sessionId = SessionIdStub({ value: 'sess-integ-001' }),
  }: { sessionId?: ClaudeQueueResponse['sessionId'] } = {}): ClaudeQueueResponse => ({
    sessionId,
    lines: [
      StreamJsonLineStub({
        value: JSON.stringify(SystemInitStreamLineStub({ session_id: sessionId })),
      }),
      signalBackLine({ signal: 'complete', summary: 'Task completed successfully' }),
      StreamJsonLineStub({
        value: JSON.stringify(ResultStreamLineStub({ session_id: sessionId })),
      }),
    ],
  });

  const agentFailedResponse = ({
    sessionId = SessionIdStub({ value: 'sess-integ-fail' }),
    summary = 'Task failed',
    exitCode = ExitCodeStub({ value: 0 }),
  }: {
    sessionId?: ClaudeQueueResponse['sessionId'];
    summary?: Parameters<typeof signalBackLine>[0]['summary'];
    exitCode?: ReturnType<typeof ExitCodeStub>;
  } = {}): ClaudeQueueResponse => ({
    sessionId,
    exitCode,
    lines: [
      StreamJsonLineStub({
        value: JSON.stringify(SystemInitStreamLineStub({ session_id: sessionId })),
      }),
      signalBackLine({ signal: 'failed', summary }),
      StreamJsonLineStub({
        value: JSON.stringify(ResultStreamLineStub({ session_id: sessionId })),
      }),
    ],
  });

  const wardPassResponse = (): WardQueueResponse => ({
    exitCode: ExitCodeStub({ value: 0 }),
    runId: WardRunIdStub({ value: `ward-${String(Date.now())}` }),
    wardResultJson: { checks: [] },
  });

  const wardFailResponse = ({
    filePaths = [],
  }: { filePaths?: ReturnType<typeof FilePathStub>[] } = {}): WardQueueResponse => ({
    exitCode: ExitCodeStub({ value: 1 }),
    runId: WardRunIdStub({ value: `ward-fail-${String(Date.now())}` }),
    wardResultJson: {
      checks: [
        {
          projectResults: [
            {
              errors: filePaths.map((fp) => ({ filePath: fp })),
              testFailures: [],
            },
          ],
        },
      ],
    },
  });

  return {
    signalBackLine,
    agentSuccessResponse,
    agentFailedResponse,
    wardPassResponse,
    wardFailResponse,
  };
};
