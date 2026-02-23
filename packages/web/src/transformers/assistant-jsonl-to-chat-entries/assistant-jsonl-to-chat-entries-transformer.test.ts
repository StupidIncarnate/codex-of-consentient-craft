import {
  AssistantTextStreamLineStub,
  AssistantThinkingStreamLineStub,
  AssistantToolResultStreamLineStub,
  AssistantToolUseStreamLineStub,
} from '@dungeonmaster/shared/contracts';
import { assistantJsonlToChatEntriesTransformer } from './assistant-jsonl-to-chat-entries-transformer';

describe('assistantJsonlToChatEntriesTransformer', () => {
  describe('text content', () => {
    it('VALID: {text content with usage} => returns text entry with usage', () => {
      const stub = AssistantTextStreamLineStub({
        message: {
          role: 'assistant',
          content: [{ type: 'text', text: 'hi there' }],
          usage: { input_tokens: 100, output_tokens: 50 },
        },
      });

      const result = assistantJsonlToChatEntriesTransformer({
        entry: {
          ...stub,
          message: {
            ...stub.message,
            usage: {
              ...stub.message.usage,
              cache_creation_input_tokens: 10,
              cache_read_input_tokens: 5,
            },
          },
        },
        validSource: undefined,
        validAgentId: undefined,
      });

      expect(result).toStrictEqual([
        {
          role: 'assistant',
          type: 'text',
          content: 'hi there',
          usage: {
            inputTokens: 100,
            outputTokens: 50,
            cacheCreationInputTokens: 10,
            cacheReadInputTokens: 5,
          },
        },
      ]);
    });

    it('VALID: {model field on message} => passes model through', () => {
      const stub = AssistantTextStreamLineStub({
        message: {
          role: 'assistant',
          content: [{ type: 'text', text: 'hi there' }],
          model: 'claude-opus-4-20250514' as never,
        },
      });

      const result = assistantJsonlToChatEntriesTransformer({
        entry: stub,
        validSource: undefined,
        validAgentId: undefined,
      });

      expect(result).toStrictEqual([
        {
          role: 'assistant',
          type: 'text',
          content: 'hi there',
          model: 'claude-opus-4-20250514',
        },
      ]);
    });
  });

  describe('tool content', () => {
    it('VALID: {tool_use content} => returns tool use entry', () => {
      const result = assistantJsonlToChatEntriesTransformer({
        entry: AssistantToolUseStreamLineStub({
          message: {
            role: 'assistant',
            content: [{ type: 'tool_use', name: 'read_file', input: { path: '/test' } }],
          },
        }),
        validSource: undefined,
        validAgentId: undefined,
      });

      expect(result).toStrictEqual([
        {
          role: 'assistant',
          type: 'tool_use',
          toolName: 'read_file',
          toolInput: '{"path":"/test"}',
        },
      ]);
    });

    it('VALID: {tool_result content} => returns tool result entry', () => {
      const result = assistantJsonlToChatEntriesTransformer({
        entry: AssistantToolResultStreamLineStub({
          message: {
            role: 'assistant',
            content: [{ type: 'tool_result', tool_use_id: 'toolu_123', content: 'data' }],
          },
        }),
        validSource: undefined,
        validAgentId: undefined,
      });

      expect(result).toStrictEqual([
        {
          role: 'assistant',
          type: 'tool_result',
          toolName: 'toolu_123',
          content: 'data',
        },
      ]);
    });

    it('VALID: {thinking content} => returns thinking entry', () => {
      const stub = AssistantThinkingStreamLineStub({
        message: {
          role: 'assistant',
          content: [{ type: 'thinking', thinking: 'Let me reason about this.' }],
        },
      });

      const result = assistantJsonlToChatEntriesTransformer({
        entry: stub,
        validSource: undefined,
        validAgentId: undefined,
      });

      expect(result).toStrictEqual([
        {
          role: 'assistant',
          type: 'thinking',
          content: 'Let me reason about this.',
        },
      ]);
    });
  });

  describe('source and agentId propagation', () => {
    it('VALID: {agentId "agent-2"} => propagates to entries', () => {
      const result = assistantJsonlToChatEntriesTransformer({
        entry: AssistantToolUseStreamLineStub({
          message: {
            role: 'assistant',
            content: [{ type: 'tool_use', name: 'read_file', input: { path: '/test' } }],
          },
        }),
        validSource: undefined,
        validAgentId: 'agent-2',
      });

      expect(result).toStrictEqual([
        {
          role: 'assistant',
          type: 'tool_use',
          toolName: 'read_file',
          toolInput: '{"path":"/test"}',
          agentId: 'agent-2',
        },
      ]);
    });
  });

  describe('missing message', () => {
    it('EDGE: {no message field} => returns empty array', () => {
      const result = assistantJsonlToChatEntriesTransformer({
        entry: { type: 'assistant' },
        validSource: undefined,
        validAgentId: undefined,
      });

      expect(result).toStrictEqual([]);
    });
  });
});
