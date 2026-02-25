import {
  AssistantTextStreamLineStub,
  AssistantToolUseStreamLineStub,
  AssistantToolResultStreamLineStub,
  AssistantMixedContentStreamLineStub,
  AssistantThinkingStreamLineStub,
} from '@dungeonmaster/shared/contracts';
import { parseAssistantStreamEntryTransformer } from './parse-assistant-stream-entry-transformer';

describe('parseAssistantStreamEntryTransformer', () => {
  describe('text content', () => {
    it('VALID: {text content with usage} => returns text chat entry with usage', () => {
      const stub = AssistantTextStreamLineStub({
        message: {
          role: 'assistant',
          content: [{ type: 'text', text: 'Hello world' }],
          usage: { input_tokens: 100, output_tokens: 50 },
        },
      });

      const result = parseAssistantStreamEntryTransformer({ parsed: stub });

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
      const stub = AssistantThinkingStreamLineStub({
        message: {
          role: 'assistant',
          content: [{ type: 'thinking', thinking: 'Let me think about this.' }],
        },
      });

      const result = parseAssistantStreamEntryTransformer({ parsed: stub });

      expect(result).toStrictEqual([
        {
          role: 'assistant',
          type: 'thinking',
          content: 'Let me think about this.',
        },
      ]);
    });
  });

  describe('tool content', () => {
    it('VALID: {tool_use content} => returns tool use chat entry', () => {
      const stub = AssistantToolUseStreamLineStub({
        message: {
          role: 'assistant',
          content: [{ type: 'tool_use', name: 'read_file', input: { path: '/test' } }],
        },
      });

      const result = parseAssistantStreamEntryTransformer({ parsed: stub });

      expect(result).toStrictEqual([
        {
          role: 'assistant',
          type: 'tool_use',
          toolName: 'read_file',
          toolInput: '{"path":"/test"}',
        },
      ]);
    });

    it('VALID: {tool_result content} => returns tool result chat entry', () => {
      const stub = AssistantToolResultStreamLineStub({
        message: {
          role: 'assistant',
          content: [{ type: 'tool_result', tool_use_id: 'toolu_123', content: 'file data' }],
        },
      });

      const result = parseAssistantStreamEntryTransformer({ parsed: stub });

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
    it('VALID: {multiple content items} => returns multiple entries', () => {
      const stub = AssistantMixedContentStreamLineStub({
        message: {
          role: 'assistant',
          content: [
            { type: 'text', text: 'Let me read that file' },
            { type: 'tool_use', name: 'read_file', input: { path: '/src' } },
          ],
          usage: { input_tokens: 200, output_tokens: 100 },
        },
      });

      const result = parseAssistantStreamEntryTransformer({ parsed: stub });

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
      const stub = AssistantTextStreamLineStub({
        message: {
          role: 'assistant',
          content: [{ type: 'text', text: 'will be removed' }],
        },
      });
      Reflect.deleteProperty(stub, 'message');

      const result = parseAssistantStreamEntryTransformer({ parsed: stub });

      expect(result).toStrictEqual([]);
    });

    it('EDGE: {unrecognized content item type} => skips unknown items', () => {
      const stub = AssistantTextStreamLineStub({
        message: {
          role: 'assistant',
          content: [{ type: 'text', text: 'valid' }],
        },
      });
      stub.message.content = [{ type: 'unknown_type' } as never];

      const result = parseAssistantStreamEntryTransformer({ parsed: stub });

      expect(result).toStrictEqual([]);
    });

    it('VALID: {model field on message} => passes model to entries', () => {
      const stub = AssistantTextStreamLineStub({
        message: {
          role: 'assistant',
          content: [{ type: 'text', text: 'Hello world' }],
          model: 'claude-opus-4-20250514' as never,
        },
      });

      const result = parseAssistantStreamEntryTransformer({ parsed: stub });

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
});
