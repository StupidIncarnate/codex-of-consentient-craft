/**
 * PURPOSE: Provides JSONL line builder helpers for constructing Claude CLI output shapes in integration tests
 *
 * USAGE:
 * const jsonl = orchestrationJsonlHarness();
 * const response = jsonl.agentSuccessResponse({ sessionId: SessionIdStub({ value: 'sess-001' }) });
 * queue.enqueue({ queueDir, response });
 */
import {
  resultStreamLineContract,
  systemInitStreamLineContract,
} from '@dungeonmaster/shared/contracts';
import type { ClaudeQueueResponseStub } from '@dungeonmaster/shared/contracts/claude-queue-response/claude-queue-response.stub';
import type { WardQueueResponseStub } from '@dungeonmaster/shared/contracts/ward-queue-response/ward-queue-response.stub';
import { ResultStreamLineStub } from '@dungeonmaster/shared/contracts/result-stream-line/result-stream-line.stub';
import { SessionIdStub } from '@dungeonmaster/shared/contracts/session-id/session-id.stub';
import { StreamJsonLineStub } from '@dungeonmaster/shared/contracts/stream-json-line/stream-json-line.stub';
import { SystemInitStreamLineStub } from '@dungeonmaster/shared/contracts/system-init-stream-line/system-init-stream-line.stub';
import { WardRunIdStub } from '@dungeonmaster/shared/contracts/ward-run-id/ward-run-id.stub';

type ClaudeQueueResponse = ReturnType<typeof ClaudeQueueResponseStub>;
type WardQueueResponse = ReturnType<typeof WardQueueResponseStub>;
type ResultStreamLine = ReturnType<typeof ResultStreamLineStub>;
type SystemInitStreamLine = ReturnType<typeof SystemInitStreamLineStub>;

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
    exitCode?: number;
  }) => ClaudeQueueResponse;
  wardPassResponse: () => WardQueueResponse;
  wardFailResponse: (params?: {
    filePaths?: string[];
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

  const rawCliLine = ({
    line,
  }: {
    line: ResultStreamLine | SystemInitStreamLine;
  }): ReturnType<typeof StreamJsonLineStub> =>
    StreamJsonLineStub({
      value: JSON.stringify(
        line.type === 'result'
          ? resultStreamLineContract.parse(line)
          : systemInitStreamLineContract.parse(line),
      ),
    });

  const agentSuccessResponse = ({
    sessionId = SessionIdStub({ value: 'sess-integ-001' }),
  }: { sessionId?: ClaudeQueueResponse['sessionId'] } = {}): ClaudeQueueResponse => ({
    sessionId,
    lines: [
      rawCliLine({ line: SystemInitStreamLineStub({ session_id: sessionId }) }),
      signalBackLine({ signal: 'complete', summary: 'Task completed successfully' }),
      rawCliLine({ line: ResultStreamLineStub({ session_id: sessionId }) }),
    ],
  });

  const agentFailedResponse = ({
    sessionId = SessionIdStub({ value: 'sess-integ-fail' }),
    summary = 'Task failed',
    exitCode = 0,
  }: {
    sessionId?: ClaudeQueueResponse['sessionId'];
    summary?: Parameters<typeof signalBackLine>[0]['summary'];
    exitCode?: number;
  } = {}): ClaudeQueueResponse => ({
    sessionId,
    exitCode,
    lines: [
      rawCliLine({ line: SystemInitStreamLineStub({ session_id: sessionId }) }),
      signalBackLine({ signal: 'failed', summary }),
      rawCliLine({ line: ResultStreamLineStub({ session_id: sessionId }) }),
    ],
  });

  const wardPassResponse = (): WardQueueResponse => ({
    exitCode: 0,
    runId: WardRunIdStub({ value: `ward-${String(Date.now())}` }),
    wardResultJson: { checks: [] },
  });

  const wardFailResponse = ({
    filePaths = [],
  }: { filePaths?: string[] } = {}): WardQueueResponse => ({
    exitCode: 1,
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
