import {
  AssistantTextStreamLineStub,
  AssistantToolUseStreamLineStub,
  AssistantToolResultStreamLineStub,
  AssistantMixedContentStreamLineStub,
  AssistantThinkingStreamLineStub,
} from '@dungeonmaster/shared/contracts';
import { snakeKeysToCamelKeysTransformer } from '@dungeonmaster/shared/transformers';
import { parseAssistantStreamEntryTransformer } from './parse-assistant-stream-entry-transformer';

const normalize = (value: unknown): object => snakeKeysToCamelKeysTransformer({ value }) as object;

describe('parseAssistantStreamEntryTransformer', () => {
  describe('text content', () => {
    it('VALID: {text content with usage} => returns text chat entry with usage', () => {
      const result = parseAssistantStreamEntryTransformer({
        parsed: normalize(
          AssistantTextStreamLineStub({
            message: {
              role: 'assistant',
              content: [{ type: 'text', text: 'Hello world' }],
              usage: { input_tokens: 100, output_tokens: 50 },
            },
          }),
        ),
      });

      expect(result).toStrictEqual([
        {
          role: 'assistant',
          type: 'text',
          content: 'Hello world',
          usage: {
            inputTokens: 100,
            outputTokens: 50,
            cacheCreationInputTokens: 0,
            cacheReadInputTokens: 0,
          },
        },
      ]);
    });

    it('VALID: {thinking content} => returns thinking entry', () => {
      const result = parseAssistantStreamEntryTransformer({
        parsed: normalize(
          AssistantThinkingStreamLineStub({
            message: {
              role: 'assistant',
              content: [{ type: 'thinking', thinking: 'Let me think about this.' }],
            },
          }),
        ),
      });

      expect(result).toStrictEqual([
        {
          role: 'assistant',
          type: 'thinking',
          content: 'Let me think about this.',
        },
      ]);
    });

    it('EMPTY: {redacted_thinking content} => skips item — no handler in mapContentItemToChatEntryTransformer', () => {
      const result = parseAssistantStreamEntryTransformer({
        parsed: normalize({
          type: 'assistant',
          message: {
            role: 'assistant',
            content: [{ type: 'redacted_thinking', data: '<encrypted-blob>' }],
          },
        }),
      });

      expect(result).toStrictEqual([]);
    });
  });

  describe('tool content', () => {
    it('VALID: {tool_use content} => returns tool use chat entry with toolUseId', () => {
      const toolUseId = 'toolu_01ParseTest001';
      const result = parseAssistantStreamEntryTransformer({
        parsed: normalize(
          AssistantToolUseStreamLineStub({
            message: {
              role: 'assistant',
              content: [
                {
                  type: 'tool_use',
                  id: toolUseId,
                  name: 'read_file',
                  input: { path: '/test' },
                },
              ],
            },
          }),
        ),
      });

      expect(result).toStrictEqual([
        {
          role: 'assistant',
          type: 'tool_use',
          toolUseId,
          toolName: 'read_file',
          toolInput: '{"path":"/test"}',
        },
      ]);
    });

    it('VALID: {tool_result content} => returns tool result chat entry', () => {
      const result = parseAssistantStreamEntryTransformer({
        parsed: normalize(
          AssistantToolResultStreamLineStub({
            message: {
              role: 'assistant',
              content: [{ type: 'tool_result', tool_use_id: 'toolu_123', content: 'file data' }],
            },
          }),
        ),
      });

      expect(result).toStrictEqual([
        {
          role: 'assistant',
          type: 'tool_result',
          toolName: 'toolu_123',
          content: 'file data',
        },
      ]);
    });
  });

  describe('mixed content', () => {
    it('VALID: {multiple content items} => returns multiple entries with toolUseId on tool_use', () => {
      const toolUseId = 'toolu_01ParseMixed001';
      const result = parseAssistantStreamEntryTransformer({
        parsed: normalize(
          AssistantMixedContentStreamLineStub({
            message: {
              role: 'assistant',
              content: [
                { type: 'text', text: 'Let me read that file' },
                {
                  type: 'tool_use',
                  id: toolUseId,
                  name: 'read_file',
                  input: { path: '/src' },
                },
              ],
              usage: { input_tokens: 200, output_tokens: 100 },
            },
          }),
        ),
      });

      expect(result).toStrictEqual([
        {
          role: 'assistant',
          type: 'text',
          content: 'Let me read that file',
          usage: {
            inputTokens: 200,
            outputTokens: 100,
            cacheCreationInputTokens: 0,
            cacheReadInputTokens: 0,
          },
        },
        {
          role: 'assistant',
          type: 'tool_use',
          toolUseId,
          toolName: 'read_file',
          toolInput: '{"path":"/src"}',
          usage: {
            inputTokens: 200,
            outputTokens: 100,
            cacheCreationInputTokens: 0,
            cacheReadInputTokens: 0,
          },
        },
      ]);
    });
  });

  describe('edge cases', () => {
    it('EDGE: {no message field} => returns empty array', () => {
      const stub = normalize(
        AssistantTextStreamLineStub({
          message: {
            role: 'assistant',
            content: [{ type: 'text', text: 'will be removed' }],
          },
        }),
      );
      Reflect.deleteProperty(stub, 'message');

      const result = parseAssistantStreamEntryTransformer({ parsed: stub });

      expect(result).toStrictEqual([]);
    });

    it('EDGE: {message is null} => returns empty array', () => {
      const result = parseAssistantStreamEntryTransformer({
        parsed: { type: 'assistant', message: null },
      });

      expect(result).toStrictEqual([]);
    });

    it('EDGE: {content is not array} => returns empty array', () => {
      const result = parseAssistantStreamEntryTransformer({
        parsed: { type: 'assistant', message: { content: 'not-an-array' } },
      });

      expect(result).toStrictEqual([]);
    });

    it('EDGE: {content array has null item} => skips null items', () => {
      const result = parseAssistantStreamEntryTransformer({
        parsed: normalize({
          type: 'assistant',
          message: {
            content: [null, { type: 'text', text: 'valid' }],
          },
        }),
      });

      expect(result).toStrictEqual([
        {
          role: 'assistant',
          type: 'text',
          content: 'valid',
        },
      ]);
    });

    it('EDGE: {unrecognized content item type} => skips unknown items', () => {
      const result = parseAssistantStreamEntryTransformer({
        parsed: normalize({
          type: 'assistant',
          message: {
            role: 'assistant',
            content: [{ type: 'unknown_type' }],
          },
        }),
      });

      expect(result).toStrictEqual([]);
    });

    it('VALID: {model field on message} => passes model to entries', () => {
      const result = parseAssistantStreamEntryTransformer({
        parsed: normalize(
          AssistantTextStreamLineStub({
            message: {
              role: 'assistant',
              content: [{ type: 'text', text: 'Hello world' }],
              model: 'claude-opus-4-20250514' as never,
            },
          }),
        ),
      });

      expect(result).toStrictEqual([
        {
          role: 'assistant',
          type: 'text',
          content: 'Hello world',
          model: 'claude-opus-4-20250514',
        },
      ]);
    });
  });

  describe('source and agentId resolution', () => {
    it('VALID: {top-level source and agentId, no item-level} => uses top-level values', () => {
      const result = parseAssistantStreamEntryTransformer({
        parsed: normalize({
          type: 'assistant',
          source: 'subagent',
          agentId: 'top-agent',
          message: {
            content: [{ type: 'text', text: 'hello' }],
          },
        }),
      });

      expect(result).toStrictEqual([
        {
          role: 'assistant',
          type: 'text',
          content: 'hello',
          source: 'subagent',
          agentId: 'top-agent',
        },
      ]);
    });

    it('VALID: {item-level source and agentId override top-level} => uses item-level values', () => {
      const result = parseAssistantStreamEntryTransformer({
        parsed: normalize({
          type: 'assistant',
          source: 'session',
          agentId: 'top-agent',
          message: {
            content: [{ type: 'text', text: 'hello', source: 'subagent', agentId: 'item-agent' }],
          },
        }),
      });

      expect(result).toStrictEqual([
        {
          role: 'assistant',
          type: 'text',
          content: 'hello',
          source: 'subagent',
          agentId: 'item-agent',
        },
      ]);
    });

    it('EDGE: {invalid top-level source} => source is omitted', () => {
      const result = parseAssistantStreamEntryTransformer({
        parsed: normalize({
          type: 'assistant',
          source: 'invalid',
          message: {
            content: [{ type: 'text', text: 'hello' }],
          },
        }),
      });

      expect(result).toStrictEqual([
        {
          role: 'assistant',
          type: 'text',
          content: 'hello',
        },
      ]);
    });

    it('EDGE: {empty agentId string} => agentId is omitted', () => {
      const result = parseAssistantStreamEntryTransformer({
        parsed: normalize({
          type: 'assistant',
          agentId: '',
          message: {
            content: [{ type: 'text', text: 'hello' }],
          },
        }),
      });

      expect(result).toStrictEqual([
        {
          role: 'assistant',
          type: 'text',
          content: 'hello',
        },
      ]);
    });
  });
});
