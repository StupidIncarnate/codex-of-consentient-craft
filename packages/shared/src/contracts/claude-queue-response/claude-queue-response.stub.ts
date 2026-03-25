import type { StubArgument } from '@dungeonmaster/shared/@types';

import type { AssistantStreamLine } from '../assistant-stream-line/assistant-stream-line-contract';
import type { SessionId } from '../session-id/session-id-contract';
import {
  AssistantTextStreamLineStub,
  AssistantToolUseStreamLineStub,
  AssistantToolResultStreamLineStub,
} from '../assistant-stream-line/assistant-stream-line.stub';
import { ExitCodeStub } from '../exit-code/exit-code.stub';
import { ResultStreamLineStub } from '../result-stream-line/result-stream-line.stub';
import { SessionIdStub } from '../session-id/session-id.stub';
import { streamJsonLineContract } from '../stream-json-line/stream-json-line-contract';
import type { StreamJsonLine } from '../stream-json-line/stream-json-line-contract';
import { SystemInitStreamLineStub } from '../system-init-stream-line/system-init-stream-line.stub';

import { claudeQueueResponseContract } from './claude-queue-response-contract';
import type { ClaudeQueueResponse } from './claude-queue-response-contract';

// ── Branded type aliases ───────────────────────────────────────────────────────

type ContentItem = AssistantStreamLine['message']['content'][0];
type TextContent = NonNullable<ContentItem['text']>;
type ToolUseId = NonNullable<ContentItem['id']>;
type ToolName = NonNullable<ContentItem['name']>;
type ToolResultContent = Exclude<NonNullable<ContentItem['content']>, unknown[]>;
type UsageBlock = NonNullable<AssistantStreamLine['message']['usage']>;
type InputTokenCount = UsageBlock['input_tokens'];
type OutputTokenCount = UsageBlock['output_tokens'];

// ── Private line builders (transformers used internally by stubs) ───────────────

const DEFAULT_SESSION_ID = SessionIdStub({
  value: 'e2e-session-00000000-0000-0000-0000-000000000000',
});

const DEFAULT_USAGE = {
  input_tokens: 100 as InputTokenCount,
  output_tokens: 50 as OutputTokenCount,
};

const toLine = (obj: object): StreamJsonLine => streamJsonLineContract.parse(JSON.stringify(obj));

const sessionOrDefault = ({
  value,
}: {
  value: ReturnType<typeof SessionIdStub> | ReturnType<typeof String> | undefined;
}): SessionId =>
  value === undefined ? DEFAULT_SESSION_ID : SessionIdStub({ value: String(value) });

const initLine = ({ sessionId = DEFAULT_SESSION_ID } = {}): StreamJsonLine =>
  toLine(SystemInitStreamLineStub({ session_id: sessionId }) as object);

const textLine = ({
  text = 'Hello from Claude' as TextContent,
  usage = DEFAULT_USAGE,
} = {}): StreamJsonLine =>
  toLine(
    AssistantTextStreamLineStub({
      message: {
        role: 'assistant' as const,
        content: [{ type: 'text' as const, text }],
        usage,
      },
    }) as object,
  );

const toolUseLine = ({
  id = 'toolu_e2e_00000000' as ToolUseId,
  name = 'Read' as ToolName,
  input = { file_path: '/test.ts' } as Record<PropertyKey, unknown>,
} = {}): StreamJsonLine =>
  toLine(
    AssistantToolUseStreamLineStub({
      message: {
        role: 'assistant' as const,
        content: [{ type: 'tool_use' as const, id, name, input }],
      },
    }) as object,
  );

const toolResultLine = ({
  toolUseId = 'toolu_e2e_00000000' as ToolUseId,
  content = 'file contents' as ToolResultContent,
} = {}): StreamJsonLine =>
  toLine(
    AssistantToolResultStreamLineStub({
      message: {
        role: 'assistant' as const,
        content: [{ type: 'tool_result' as const, tool_use_id: toolUseId, content }],
      },
    }) as object,
  );

const resultLine = ({ sessionId = DEFAULT_SESSION_ID } = {}): StreamJsonLine =>
  toLine(ResultStreamLineStub({ session_id: sessionId }) as object);

// ── Response stubs ─────────────────────────────────────────────────────────────

export const ClaudeQueueResponseStub = ({
  ...props
}: StubArgument<ClaudeQueueResponse> = {}): ClaudeQueueResponse =>
  claudeQueueResponseContract.parse({
    sessionId: 'sess-stub-001',
    lines: [],
    ...props,
  });

/**
 * Simple text response — init + text + result.
 * Most common response: Claude answers with plain text.
 * Accepts optional `text` key to customize the assistant message (defaults to "Hello from Claude").
 */
export const SimpleTextResponseStub = ({
  ...props
}: StubArgument<ClaudeQueueResponse> = {}): ClaudeQueueResponse => {
  const customText = Reflect.get(props, 'text') as string | undefined;
  const sessionId = sessionOrDefault({ value: props.sessionId });
  return claudeQueueResponseContract.parse({
    sessionId,
    lines: [
      initLine({ sessionId }),
      textLine(customText === undefined ? undefined : { text: customText as TextContent }),
      resultLine({ sessionId }),
    ],
    ...props,
  });
};

/**
 * Tool use chain response — init + tool_use + tool_result + follow-up text + result.
 * Claude calls a tool and then provides a text follow-up.
 * Accepts optional `followUpText` and `toolName` keys for customization.
 */
export const ToolUseChainResponseStub = ({
  ...props
}: StubArgument<ClaudeQueueResponse> = {}): ClaudeQueueResponse => {
  const customFollowUpText = Reflect.get(props, 'followUpText') as string | undefined;
  const customToolName = Reflect.get(props, 'toolName') as string | undefined;
  const sessionId = sessionOrDefault({ value: props.sessionId });
  return claudeQueueResponseContract.parse({
    sessionId,
    lines: [
      initLine({ sessionId }),
      toolUseLine(customToolName === undefined ? undefined : { name: customToolName as ToolName }),
      toolResultLine(),
      textLine(
        customFollowUpText === undefined ? undefined : { text: customFollowUpText as TextContent },
      ),
      resultLine({ sessionId }),
    ],
    ...props,
  });
};

/**
 * Error response — init + partial text, non-zero exit code.
 * Simulates Claude CLI exiting with an error.
 */
export const ErrorResponseStub = ({
  ...props
}: StubArgument<ClaudeQueueResponse> = {}): ClaudeQueueResponse => {
  const customText = Reflect.get(props, 'partialOutput') as string | undefined;
  const sessionId = sessionOrDefault({ value: props.sessionId });
  return claudeQueueResponseContract.parse({
    sessionId,
    lines: [
      initLine({ sessionId }),
      textLine({ text: (customText ?? 'Processing...') as TextContent }),
    ],
    exitCode: ExitCodeStub({ value: 1 }),
    ...props,
  });
};

/**
 * Resume response — text + result (no init).
 * Simulates a resumed session where init was already sent.
 */
export const ResumeResponseStub = ({
  ...props
}: StubArgument<ClaudeQueueResponse> = {}): ClaudeQueueResponse => {
  const customText = Reflect.get(props, 'text') as string | undefined;
  const sessionId = sessionOrDefault({ value: props.sessionId });
  return claudeQueueResponseContract.parse({
    sessionId,
    lines: [
      textLine(customText === undefined ? undefined : { text: customText as TextContent }),
      resultLine({ sessionId }),
    ],
    ...props,
  });
};

/**
 * Clarification response — init + ask-user-question tool_use + result.
 * Claude asks the user a question via MCP tool.
 */
export const ClarificationResponseStub = ({
  ...props
}: StubArgument<ClaudeQueueResponse> = {}): ClaudeQueueResponse => {
  const sessionId = sessionOrDefault({ value: props.sessionId });
  return claudeQueueResponseContract.parse({
    sessionId,
    lines: [
      initLine({ sessionId }),
      toolUseLine({
        name: 'mcp__dungeonmaster__ask-user-question' as ToolName,
        input: {
          questions: [
            {
              question: 'Which database do you want to use?',
              header: 'Database Selection',
              options: [
                { label: 'PostgreSQL', description: 'Relational database with JSONB support' },
                { label: 'SQLite', description: 'Lightweight file-based database' },
              ],
              multiSelect: false,
            },
          ],
        },
      }),
      resultLine({ sessionId }),
    ],
    ...props,
  });
};
