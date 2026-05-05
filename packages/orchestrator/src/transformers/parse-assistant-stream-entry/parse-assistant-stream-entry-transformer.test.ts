import {
  AssistantTextStreamLineStub,
  AssistantToolUseStreamLineStub,
  AssistantToolResultStreamLineStub,
  AssistantMixedContentStreamLineStub,
  AssistantThinkingStreamLineStub,
} from '@dungeonmaster/shared/contracts';
import { snakeKeysToCamelKeysTransformer } from '@dungeonmaster/shared/transformers';
import { parseAssistantStreamEntryTransformer } from './parse-assistant-stream-entry-transformer';
import { parseAssistantStreamEntryTransformerProxy } from './parse-assistant-stream-entry-transformer.proxy';

const normalize = (value: unknown): object => snakeKeysToCamelKeysTransformer({ value }) as object;

const UUID1 = '00000000-0000-4000-8000-000000000001';
const TS = '1970-01-01T00:00:00.000Z';

describe('parseAssistantStreamEntryTransformer', () => {
  describe('text content', () => {
    it('VALID: {text content with usage} => returns text chat entry with usage', () => {
      const proxy = parseAssistantStreamEntryTransformerProxy();
      proxy.setupUuids({ uuids: [UUID1] });
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
          uuid: `${UUID1}:0`,
          timestamp: TS,
        },
      ]);
    });

    it('VALID: {thinking content} => returns thinking entry', () => {
      const proxy = parseAssistantStreamEntryTransformerProxy();
      proxy.setupUuids({ uuids: [UUID1] });
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
          uuid: `${UUID1}:0`,
          timestamp: TS,
        },
      ]);
    });
  });

  describe('tool content', () => {
    it('VALID: {tool_use content} => returns tool use chat entry', () => {
      const proxy = parseAssistantStreamEntryTransformerProxy();
      proxy.setupUuids({ uuids: [UUID1] });
      const result = parseAssistantStreamEntryTransformer({
        parsed: normalize(
          AssistantToolUseStreamLineStub({
            message: {
              role: 'assistant',
              content: [
                {
                  type: 'tool_use',
                  id: 'toolu_01ParseTest001',
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
          toolUseId: 'toolu_01ParseTest001',
          toolName: 'read_file',
          toolInput: '{"path":"/test"}',
          uuid: `${UUID1}:0`,
          timestamp: TS,
        },
      ]);
    });

    it('VALID: {tool_result content} => returns tool result chat entry', () => {
      const proxy = parseAssistantStreamEntryTransformerProxy();
      proxy.setupUuids({ uuids: [UUID1] });
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
          uuid: `${UUID1}:0`,
          timestamp: TS,
        },
      ]);
    });
  });

  describe('mixed content', () => {
    it('VALID: {multiple content items} => returns multiple entries', () => {
      const proxy = parseAssistantStreamEntryTransformerProxy();
      proxy.setupUuids({ uuids: [UUID1] });
      const result = parseAssistantStreamEntryTransformer({
        parsed: normalize(
          AssistantMixedContentStreamLineStub({
            message: {
              role: 'assistant',
              content: [
                { type: 'text', text: 'Let me read that file' },
                {
                  type: 'tool_use',
                  id: 'toolu_01ParseMixed001',
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
          uuid: `${UUID1}:0`,
          timestamp: TS,
        },
        {
          role: 'assistant',
          type: 'tool_use',
          toolUseId: 'toolu_01ParseMixed001',
          toolName: 'read_file',
          toolInput: '{"path":"/src"}',
          usage: {
            inputTokens: 200,
            outputTokens: 100,
            cacheCreationInputTokens: 0,
            cacheReadInputTokens: 0,
          },
          uuid: `${UUID1}:1`,
          timestamp: TS,
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
      const proxy = parseAssistantStreamEntryTransformerProxy();
      proxy.setupUuids({ uuids: [UUID1] });
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
          uuid: `${UUID1}:1`,
          timestamp: TS,
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
      const proxy = parseAssistantStreamEntryTransformerProxy();
      proxy.setupUuids({ uuids: [UUID1] });
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
          uuid: `${UUID1}:0`,
          timestamp: TS,
        },
      ]);
    });
  });

  describe('source and agentId resolution', () => {
    it('VALID: {top-level source and agentId, no item-level} => uses top-level values', () => {
      const proxy = parseAssistantStreamEntryTransformerProxy();
      proxy.setupUuids({ uuids: [UUID1] });
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
          uuid: `${UUID1}:0`,
          timestamp: TS,
        },
      ]);
    });

    it('VALID: {item-level source and agentId override top-level} => uses item-level values', () => {
      const proxy = parseAssistantStreamEntryTransformerProxy();
      proxy.setupUuids({ uuids: [UUID1] });
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
          uuid: `${UUID1}:0`,
          timestamp: TS,
        },
      ]);
    });

    it('EDGE: {invalid top-level source} => source is omitted', () => {
      const proxy = parseAssistantStreamEntryTransformerProxy();
      proxy.setupUuids({ uuids: [UUID1] });
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
          uuid: `${UUID1}:0`,
          timestamp: TS,
        },
      ]);
    });

    it('EDGE: {empty agentId string} => agentId is omitted', () => {
      const proxy = parseAssistantStreamEntryTransformerProxy();
      proxy.setupUuids({ uuids: [UUID1] });
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
          uuid: `${UUID1}:0`,
          timestamp: TS,
        },
      ]);
    });
  });
});
