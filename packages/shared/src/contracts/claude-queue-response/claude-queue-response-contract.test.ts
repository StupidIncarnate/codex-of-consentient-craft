import { claudeQueueResponseContract } from './claude-queue-response-contract';
import {
  ClaudeQueueResponseStub,
  SimpleTextResponseStub,
  ToolUseChainResponseStub,
  ErrorResponseStub,
  ResumeResponseStub,
  ClarificationResponseStub,
} from './claude-queue-response.stub';

import {
  AssistantTextStreamLineStub,
  AssistantToolUseStreamLineStub,
  AssistantToolResultStreamLineStub,
} from '../assistant-stream-line/assistant-stream-line.stub';
import { ExitCodeStub } from '../exit-code/exit-code.stub';
import { ResultStreamLineStub } from '../result-stream-line/result-stream-line.stub';
import { SessionIdStub } from '../session-id/session-id.stub';
import { streamJsonLineContract } from '../stream-json-line/stream-json-line-contract';
import { StreamJsonLineStub } from '../stream-json-line/stream-json-line.stub';
import { SystemInitStreamLineStub } from '../system-init-stream-line/system-init-stream-line.stub';
import { TimeoutMsStub } from '../timeout-ms/timeout-ms.stub';

type ClaudeQueueResponse = ReturnType<typeof ClaudeQueueResponseStub>;

const DEFAULT_SESSION_ID = SessionIdStub({
  value: 'e2e-session-00000000-0000-0000-0000-000000000000',
});

const toLine = (obj: object): ReturnType<typeof streamJsonLineContract.parse> =>
  streamJsonLineContract.parse(JSON.stringify(obj));

const initLine = toLine(SystemInitStreamLineStub({ session_id: DEFAULT_SESSION_ID }));

const defaultTextLine = toLine(
  AssistantTextStreamLineStub({
    message: {
      role: 'assistant',
      content: [{ type: 'text', text: 'Hello from Claude' }],
      usage: { input_tokens: 100, output_tokens: 50 },
      stop_reason: null,
    },
  }),
);

const customTextLine = ({ text }: { text: string }): ReturnType<typeof toLine> =>
  toLine(
    AssistantTextStreamLineStub({
      message: {
        role: 'assistant',
        content: [{ type: 'text', text }],
        usage: { input_tokens: 100, output_tokens: 50 },
        stop_reason: null,
      },
    }),
  );

const defaultToolUseLine = toLine(
  AssistantToolUseStreamLineStub({
    message: {
      role: 'assistant',
      content: [
        {
          type: 'tool_use',
          id: 'toolu_e2e_00000000',
          name: 'Read',
          input: { file_path: '/test.ts' },
        },
      ],
      stop_reason: null,
    },
  }),
);

const defaultToolResultLine = toLine(
  AssistantToolResultStreamLineStub({
    message: {
      role: 'assistant',
      content: [
        { type: 'tool_result', tool_use_id: 'toolu_e2e_00000000', content: 'file contents' },
      ],
      stop_reason: null,
    },
  }),
);

const resultLine = toLine(ResultStreamLineStub({ session_id: DEFAULT_SESSION_ID }));

const clarificationToolUseLine = toLine(
  AssistantToolUseStreamLineStub({
    message: {
      role: 'assistant',
      content: [
        {
          type: 'tool_use',
          id: 'toolu_e2e_00000000',
          name: 'mcp__dungeonmaster__ask-user-question',
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
        },
      ],
      stop_reason: null,
    },
  }),
);

describe('claudeQueueResponseContract', () => {
  describe('valid responses', () => {
    it('VALID: {minimal fields} => parses response with sessionId and lines', () => {
      const result = claudeQueueResponseContract.parse({
        sessionId: SessionIdStub(),
        lines: [StreamJsonLineStub()],
      });

      expect(result).toStrictEqual({
        sessionId: SessionIdStub(),
        lines: [StreamJsonLineStub()],
      });
    });

    it('VALID: {all fields} => parses response with all optional fields', () => {
      const result = claudeQueueResponseContract.parse({
        sessionId: SessionIdStub(),
        lines: [],
        exitCode: ExitCodeStub(),
        delayMs: TimeoutMsStub(),
      });

      expect(result).toStrictEqual({
        sessionId: SessionIdStub(),
        lines: [],
        exitCode: ExitCodeStub(),
        delayMs: TimeoutMsStub(),
      });
    });
  });

  describe('stub', () => {
    it('VALID: stub default => returns default response', () => {
      const response: ClaudeQueueResponse = ClaudeQueueResponseStub();

      expect(response).toStrictEqual({
        sessionId: 'sess-stub-001',
        lines: [],
      });
    });

    it('VALID: SimpleTextResponseStub() => init + text + result lines', () => {
      const response: ClaudeQueueResponse = SimpleTextResponseStub();

      expect(response).toStrictEqual({
        sessionId: DEFAULT_SESSION_ID,
        lines: [initLine, defaultTextLine, resultLine],
      });
    });

    it('VALID: SimpleTextResponseStub({text}) => customizes the text line', () => {
      const response: ClaudeQueueResponse = SimpleTextResponseStub({ text: 'Custom answer' });

      expect(response).toStrictEqual({
        sessionId: DEFAULT_SESSION_ID,
        lines: [initLine, customTextLine({ text: 'Custom answer' }), resultLine],
      });
    });

    it('VALID: ToolUseChainResponseStub() => init + tool_use + tool_result + text + result', () => {
      const response: ClaudeQueueResponse = ToolUseChainResponseStub();

      expect(response).toStrictEqual({
        sessionId: DEFAULT_SESSION_ID,
        lines: [initLine, defaultToolUseLine, defaultToolResultLine, defaultTextLine, resultLine],
      });
    });

    it('VALID: ToolUseChainResponseStub({followUpText}) => customizes the follow-up text line', () => {
      const response: ClaudeQueueResponse = ToolUseChainResponseStub({ followUpText: 'Done' });

      expect(response).toStrictEqual({
        sessionId: DEFAULT_SESSION_ID,
        lines: [
          initLine,
          defaultToolUseLine,
          defaultToolResultLine,
          customTextLine({ text: 'Done' }),
          resultLine,
        ],
      });
    });

    it('VALID: ErrorResponseStub() => init + partial text + non-zero exitCode', () => {
      const response: ClaudeQueueResponse = ErrorResponseStub();

      expect(response).toStrictEqual({
        sessionId: DEFAULT_SESSION_ID,
        lines: [initLine, customTextLine({ text: 'Processing...' })],
        exitCode: ExitCodeStub({ value: 1 }),
      });
    });

    it('VALID: ErrorResponseStub({partialOutput}) => customizes the partial text line', () => {
      const response: ClaudeQueueResponse = ErrorResponseStub({
        partialOutput: 'Crashed mid-turn',
      });

      expect(response).toStrictEqual({
        sessionId: DEFAULT_SESSION_ID,
        lines: [initLine, customTextLine({ text: 'Crashed mid-turn' })],
        exitCode: ExitCodeStub({ value: 1 }),
      });
    });

    it('VALID: ResumeResponseStub() => text + result lines (no init)', () => {
      const response: ClaudeQueueResponse = ResumeResponseStub();

      expect(response).toStrictEqual({
        sessionId: DEFAULT_SESSION_ID,
        lines: [defaultTextLine, resultLine],
      });
    });

    it('VALID: ResumeResponseStub({text}) => customizes the text line', () => {
      const response: ClaudeQueueResponse = ResumeResponseStub({ text: 'Resumed answer' });

      expect(response).toStrictEqual({
        sessionId: DEFAULT_SESSION_ID,
        lines: [customTextLine({ text: 'Resumed answer' }), resultLine],
      });
    });

    it('VALID: ClarificationResponseStub() => init + ask-user-question tool_use + result', () => {
      const response: ClaudeQueueResponse = ClarificationResponseStub();

      expect(response).toStrictEqual({
        sessionId: DEFAULT_SESSION_ID,
        lines: [initLine, clarificationToolUseLine, resultLine],
      });
    });
  });

  describe('invalid responses', () => {
    it('INVALID: {sessionId: missing} => throws for missing sessionId', () => {
      expect(() => claudeQueueResponseContract.parse({ lines: [] })).toThrow(/invalid_type/u);
    });

    it('INVALID: {lines: missing} => throws for missing lines', () => {
      expect(() => claudeQueueResponseContract.parse({ sessionId: 'sess-1' })).toThrow(
        /invalid_type/u,
      );
    });
  });
});
