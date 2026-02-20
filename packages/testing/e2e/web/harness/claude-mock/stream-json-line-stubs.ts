import type { StreamJsonUsage, ToolUseConfig } from './types';

const DEFAULT_SESSION_ID = 'e2e-session-00000000-0000-0000-0000-000000000000';

const DEFAULT_USAGE: StreamJsonUsage = {
  input_tokens: 100,
  output_tokens: 50,
  cache_creation_input_tokens: 0,
  cache_read_input_tokens: 0,
};

export const SessionInitLineStub = ({
  sessionId = DEFAULT_SESSION_ID,
}: { sessionId?: string } = {}): string =>
  JSON.stringify({
    type: 'system',
    subtype: 'init',
    session_id: sessionId,
  });

export const TextLineStub = ({
  text = 'Hello from Claude',
  usage = DEFAULT_USAGE,
}: { text?: string; usage?: StreamJsonUsage } = {}): string =>
  JSON.stringify({
    type: 'assistant',
    message: {
      content: [{ type: 'text', text }],
      usage,
    },
  });

export const ToolUseLineStub = ({
  id = 'toolu_e2e_00000000',
  name = 'Read',
  input = { file_path: '/test.ts' },
}: Partial<ToolUseConfig> = {}): string =>
  JSON.stringify({
    type: 'assistant',
    message: {
      content: [{ type: 'tool_use', id, name, input }],
    },
  });

export const ToolResultLineStub = ({
  toolUseId = 'toolu_e2e_00000000',
  content = 'file contents',
}: { toolUseId?: string; content?: string } = {}): string =>
  JSON.stringify({
    type: 'assistant',
    message: {
      content: [{ type: 'tool_result', tool_use_id: toolUseId, content }],
    },
  });

export const ResultLineStub = ({
  sessionId = DEFAULT_SESSION_ID,
}: { sessionId?: string } = {}): string =>
  JSON.stringify({
    type: 'result',
    session_id: sessionId,
  });
