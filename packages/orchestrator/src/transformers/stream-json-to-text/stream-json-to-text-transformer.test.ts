import {
  AssistantTextStreamLineStub,
  AssistantToolUseStreamLineStub,
} from '@dungeonmaster/shared/contracts';
import { snakeKeysToCamelKeysTransformer } from '@dungeonmaster/shared/transformers';

import { streamJsonToTextTransformer } from './stream-json-to-text-transformer';

describe('streamJsonToTextTransformer', () => {
  describe('valid text extraction', () => {
    it('VALID: {assistant message with single text} => returns StreamText', () => {
      const result = streamJsonToTextTransformer({
        parsed: snakeKeysToCamelKeysTransformer({
          value: AssistantTextStreamLineStub({
            message: {
              role: 'assistant',
              content: [{ type: 'text', text: 'Hello from Claude' }],
            },
          }),
        }),
      });

      expect(result).toBe('Hello from Claude');
    });

    it('VALID: {assistant message with multiple text blocks} => returns concatenated StreamText', () => {
      const result = streamJsonToTextTransformer({
        parsed: snakeKeysToCamelKeysTransformer({
          value: AssistantTextStreamLineStub({
            message: {
              role: 'assistant',
              content: [
                { type: 'text', text: 'Hello ' },
                { type: 'text', text: 'World' },
              ],
            },
          }),
        }),
      });

      expect(result).toBe('Hello World');
    });

    it('VALID: {assistant message with mixed content types} => returns only text content', () => {
      const result = streamJsonToTextTransformer({
        parsed: snakeKeysToCamelKeysTransformer({
          value: AssistantTextStreamLineStub({
            message: {
              role: 'assistant',
              content: [
                { type: 'text', text: 'Before tool ' },
                {
                  type: 'tool_use',
                  id: 'toolu_01EaCJyt5y8gzMNyGYarwUDZ',
                  name: 'some_tool',
                  input: {},
                },
                { type: 'text', text: 'after tool' },
              ],
            },
          }),
        }),
      });

      expect(result).toBe('Before tool after tool');
    });

    it('VALID: {assistant message with empty string text} => returns empty StreamText', () => {
      const result = streamJsonToTextTransformer({
        parsed: snakeKeysToCamelKeysTransformer({
          value: AssistantTextStreamLineStub({
            message: {
              role: 'assistant',
              content: [{ type: 'text', text: '' }],
            },
          }),
        }),
      });

      expect(result).toBe('');
    });

    it('VALID: {assistant message with multiline text} => returns multiline StreamText', () => {
      const result = streamJsonToTextTransformer({
        parsed: snakeKeysToCamelKeysTransformer({
          value: AssistantTextStreamLineStub({
            message: {
              role: 'assistant',
              content: [{ type: 'text', text: 'Line 1\nLine 2\nLine 3' }],
            },
          }),
        }),
      });

      expect(result).toBe('Line 1\nLine 2\nLine 3');
    });
  });

  describe('no text found', () => {
    it('EMPTY: {JSON null value} => returns null', () => {
      const result = streamJsonToTextTransformer({ parsed: null });

      expect(result).toBe(null);
    });

    it('EMPTY: {JSON primitive string} => returns null', () => {
      const result = streamJsonToTextTransformer({ parsed: 'just a string' });

      expect(result).toBe(null);
    });

    it('EMPTY: {object without type property} => returns null', () => {
      const result = streamJsonToTextTransformer({
        parsed: snakeKeysToCamelKeysTransformer({
          value: JSON.parse('{"message":{"content":[]}}'),
        }),
      });

      expect(result).toBe(null);
    });

    it('EMPTY: {non-assistant message} => returns null', () => {
      const result = streamJsonToTextTransformer({
        parsed: snakeKeysToCamelKeysTransformer({
          value: JSON.parse('{"type":"system","message":"Hello"}'),
        }),
      });

      expect(result).toBe(null);
    });

    it('EMPTY: {assistant message with only tool calls} => returns null', () => {
      const result = streamJsonToTextTransformer({
        parsed: snakeKeysToCamelKeysTransformer({
          value: AssistantToolUseStreamLineStub(),
        }),
      });

      expect(result).toBe(null);
    });

    it('EMPTY: {assistant message with no content property} => returns null', () => {
      const result = streamJsonToTextTransformer({
        parsed: snakeKeysToCamelKeysTransformer({
          value: JSON.parse('{"type":"assistant","message":{}}'),
        }),
      });

      expect(result).toBe(null);
    });

    it('EMPTY: {assistant message with null message} => returns null', () => {
      const result = streamJsonToTextTransformer({
        parsed: snakeKeysToCamelKeysTransformer({
          value: JSON.parse('{"type":"assistant","message":null}'),
        }),
      });

      expect(result).toBe(null);
    });

    it('EMPTY: {assistant without message property} => returns null', () => {
      const result = streamJsonToTextTransformer({
        parsed: snakeKeysToCamelKeysTransformer({
          value: JSON.parse('{"type":"assistant"}'),
        }),
      });

      expect(result).toBe(null);
    });

    it('EMPTY: {assistant message with empty content array} => returns null', () => {
      const result = streamJsonToTextTransformer({
        parsed: snakeKeysToCamelKeysTransformer({
          value: JSON.parse('{"type":"assistant","message":{"content":[]}}'),
        }),
      });

      expect(result).toBe(null);
    });

    it('EMPTY: {assistant message with non-array content} => returns null', () => {
      const result = streamJsonToTextTransformer({
        parsed: snakeKeysToCamelKeysTransformer({
          value: JSON.parse('{"type":"assistant","message":{"content":"not an array"}}'),
        }),
      });

      expect(result).toBe(null);
    });

    it('EMPTY: {text item without text property} => returns null', () => {
      const result = streamJsonToTextTransformer({
        parsed: snakeKeysToCamelKeysTransformer({
          value: JSON.parse('{"type":"assistant","message":{"content":[{"type":"text"}]}}'),
        }),
      });

      expect(result).toBe(null);
    });

    it('EMPTY: {text item with non-string text property} => returns null', () => {
      const result = streamJsonToTextTransformer({
        parsed: snakeKeysToCamelKeysTransformer({
          value: JSON.parse(
            '{"type":"assistant","message":{"content":[{"type":"text","text":123}]}}',
          ),
        }),
      });

      expect(result).toBe(null);
    });

    it('EMPTY: {content item is null} => returns null', () => {
      const result = streamJsonToTextTransformer({
        parsed: snakeKeysToCamelKeysTransformer({
          value: JSON.parse('{"type":"assistant","message":{"content":[null]}}'),
        }),
      });

      expect(result).toBe(null);
    });

    it('EMPTY: {content item is primitive} => returns null', () => {
      const result = streamJsonToTextTransformer({
        parsed: snakeKeysToCamelKeysTransformer({
          value: JSON.parse('{"type":"assistant","message":{"content":["not an object"]}}'),
        }),
      });

      expect(result).toBe(null);
    });
  });

  describe('invalid JSON handling', () => {
    it('ERROR: {invalid JSON} => returns null', () => {
      const result = streamJsonToTextTransformer({ parsed: null });

      expect(result).toBe(null);
    });

    it('ERROR: {truncated JSON} => returns null', () => {
      const result = streamJsonToTextTransformer({ parsed: null });

      expect(result).toBe(null);
    });
  });
});
