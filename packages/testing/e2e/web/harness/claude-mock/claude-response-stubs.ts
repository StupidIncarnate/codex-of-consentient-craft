import type { ClaudeResponse, StreamJsonUsage } from './types';
import {
  SessionInitLineStub,
  TextLineStub,
  ToolUseLineStub,
  ToolResultLineStub,
  ResultLineStub,
} from './stream-json-line-stubs';

const DEFAULT_SESSION_ID = 'e2e-session-00000000-0000-0000-0000-000000000000';

export const SimpleTextResponseStub = ({
  sessionId = DEFAULT_SESSION_ID,
  text = 'Hello from Claude',
  usage,
}: { sessionId?: string; text?: string; usage?: StreamJsonUsage } = {}): ClaudeResponse => ({
  sessionId,
  lines: [
    SessionInitLineStub({ sessionId }),
    TextLineStub({ text, ...(usage ? { usage } : {}) }),
    ResultLineStub({ sessionId }),
  ],
});

export const ToolUseChainResponseStub = ({
  sessionId = DEFAULT_SESSION_ID,
  toolName = 'Read',
  toolInput = { file_path: '/test.ts' },
  toolResultContent = 'file contents',
  followUpText = 'Done!',
}: {
  sessionId?: string;
  toolName?: string;
  toolInput?: Record<string, unknown>;
  toolResultContent?: string;
  followUpText?: string;
} = {}): ClaudeResponse => ({
  sessionId,
  lines: [
    SessionInitLineStub({ sessionId }),
    ToolUseLineStub({ name: toolName, input: toolInput }),
    ToolResultLineStub({ content: toolResultContent }),
    TextLineStub({ text: followUpText }),
    ResultLineStub({ sessionId }),
  ],
});

export const ErrorResponseStub = ({
  sessionId = DEFAULT_SESSION_ID,
  partialOutput = 'Processing...',
  exitCode = 1,
}: { sessionId?: string; partialOutput?: string; exitCode?: number } = {}): ClaudeResponse => ({
  sessionId,
  lines: [SessionInitLineStub({ sessionId }), TextLineStub({ text: partialOutput })],
  exitCode,
});

export const ResumeResponseStub = ({
  sessionId = DEFAULT_SESSION_ID,
  text = 'Hello from Claude',
}: { sessionId?: string; text?: string } = {}): ClaudeResponse => ({
  sessionId,
  lines: [TextLineStub({ text }), ResultLineStub({ sessionId })],
});

export const ClarificationResponseStub = ({
  sessionId = DEFAULT_SESSION_ID,
  questions = [
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
} = {}): ClaudeResponse => ({
  sessionId,
  lines: [
    SessionInitLineStub({ sessionId }),
    ToolUseLineStub({
      name: 'mcp__dungeonmaster__ask-user-question',
      input: { questions },
    }),
    ResultLineStub({ sessionId }),
  ],
});

export const MultiTurnResponseStubs = ({
  sessionId = DEFAULT_SESSION_ID,
  messages,
}: {
  sessionId?: string;
  messages: { text: string }[];
}): ClaudeResponse[] =>
  messages.map((msg, index) => {
    if (index === 0) {
      return SimpleTextResponseStub({ sessionId, text: msg.text });
    }
    return ResumeResponseStub({ sessionId, text: msg.text });
  });
