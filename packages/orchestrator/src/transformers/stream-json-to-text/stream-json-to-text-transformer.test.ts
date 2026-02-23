import {
  AssistantTextStreamLineStub,
  AssistantToolUseStreamLineStub,
} from '@dungeonmaster/shared/contracts';

import { streamJsonToTextTransformer } from './stream-json-to-text-transformer';
import { StreamJsonLineStub } from '../../contracts/stream-json-line/stream-json-line.stub';

describe('streamJsonToTextTransformer', () => {
  describe('valid text extraction', () => {
    it('VALID: {assistant message with single text} => returns StreamText', () => {
      const line = StreamJsonLineStub({
        value: JSON.stringify(
          AssistantTextStreamLineStub({
            message: {
              role: 'assistant',
              content: [{ type: 'text', text: 'Hello from Claude' }],
            },
          }),
        ),
      });

      const result = streamJsonToTextTransformer({ line });

      expect(result).toBe('Hello from Claude');
    });

    it('VALID: {assistant message with multiple text blocks} => returns concatenated StreamText', () => {
      const line = StreamJsonLineStub({
        value: JSON.stringify(
          AssistantTextStreamLineStub({
            message: {
              role: 'assistant',
              content: [
                { type: 'text', text: 'Hello ' },
                { type: 'text', text: 'World' },
              ],
            },
          }),
        ),
      });

      const result = streamJsonToTextTransformer({ line });

      expect(result).toBe('Hello World');
    });

    it('VALID: {assistant message with mixed content types} => returns only text content', () => {
      const line = StreamJsonLineStub({
        value: JSON.stringify(
          AssistantTextStreamLineStub({
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
        ),
      });

      const result = streamJsonToTextTransformer({ line });

      expect(result).toBe('Before tool after tool');
    });

    it('VALID: {assistant message with empty string text} => returns empty StreamText', () => {
      const line = StreamJsonLineStub({
        value: JSON.stringify(
          AssistantTextStreamLineStub({
            message: {
              role: 'assistant',
              content: [{ type: 'text', text: '' }],
            },
          }),
        ),
      });

      const result = streamJsonToTextTransformer({ line });

      expect(result).toBe('');
    });

    it('VALID: {assistant message with multiline text} => returns multiline StreamText', () => {
      const line = StreamJsonLineStub({
        value: JSON.stringify(
          AssistantTextStreamLineStub({
            message: {
              role: 'assistant',
              content: [{ type: 'text', text: 'Line 1\nLine 2\nLine 3' }],
            },
          }),
        ),
      });

      const result = streamJsonToTextTransformer({ line });

      expect(result).toBe('Line 1\nLine 2\nLine 3');
    });
  });

  describe('no text found', () => {
    it('EMPTY: {JSON null value} => returns null', () => {
      const line = StreamJsonLineStub({
        value: 'null',
      });

      const result = streamJsonToTextTransformer({ line });

      expect(result).toBeNull();
    });

    it('EMPTY: {JSON primitive string} => returns null', () => {
      const line = StreamJsonLineStub({
        value: '"just a string"',
      });

      const result = streamJsonToTextTransformer({ line });

      expect(result).toBeNull();
    });

    it('EMPTY: {object without type property} => returns null', () => {
      const line = StreamJsonLineStub({
        value: JSON.stringify({
          message: { content: [] },
        }),
      });

      const result = streamJsonToTextTransformer({ line });

      expect(result).toBeNull();
    });

    it('EMPTY: {non-assistant message} => returns null', () => {
      const line = StreamJsonLineStub({
        value: JSON.stringify({
          type: 'system',
          message: 'Hello',
        }),
      });

      const result = streamJsonToTextTransformer({ line });

      expect(result).toBeNull();
    });

    it('EMPTY: {assistant message with only tool calls} => returns null', () => {
      const line = StreamJsonLineStub({
        value: JSON.stringify(AssistantToolUseStreamLineStub()),
      });

      const result = streamJsonToTextTransformer({ line });

      expect(result).toBeNull();
    });

    it('EMPTY: {assistant message with no content property} => returns null', () => {
      const line = StreamJsonLineStub({
        value: JSON.stringify({
          type: 'assistant',
          message: {},
        }),
      });

      const result = streamJsonToTextTransformer({ line });

      expect(result).toBeNull();
    });

    it('EMPTY: {assistant message with null message} => returns null', () => {
      const line = StreamJsonLineStub({
        value: JSON.stringify({
          type: 'assistant',
          message: null,
        }),
      });

      const result = streamJsonToTextTransformer({ line });

      expect(result).toBeNull();
    });

    it('EMPTY: {assistant without message property} => returns null', () => {
      const line = StreamJsonLineStub({
        value: JSON.stringify({
          type: 'assistant',
        }),
      });

      const result = streamJsonToTextTransformer({ line });

      expect(result).toBeNull();
    });

    it('EMPTY: {assistant message with empty content array} => returns null', () => {
      const line = StreamJsonLineStub({
        value: JSON.stringify({
          type: 'assistant',
          message: {
            content: [],
          },
        }),
      });

      const result = streamJsonToTextTransformer({ line });

      expect(result).toBeNull();
    });

    it('EMPTY: {assistant message with non-array content} => returns null', () => {
      const line = StreamJsonLineStub({
        value: JSON.stringify({
          type: 'assistant',
          message: {
            content: 'not an array',
          },
        }),
      });

      const result = streamJsonToTextTransformer({ line });

      expect(result).toBeNull();
    });

    it('EMPTY: {text item without text property} => returns null', () => {
      const line = StreamJsonLineStub({
        value: JSON.stringify({
          type: 'assistant',
          message: {
            content: [{ type: 'text' }],
          },
        }),
      });

      const result = streamJsonToTextTransformer({ line });

      expect(result).toBeNull();
    });

    it('EMPTY: {text item with non-string text property} => returns null', () => {
      const line = StreamJsonLineStub({
        value: JSON.stringify({
          type: 'assistant',
          message: {
            content: [{ type: 'text', text: 123 }],
          },
        }),
      });

      const result = streamJsonToTextTransformer({ line });

      expect(result).toBeNull();
    });

    it('EMPTY: {content item is null} => returns null', () => {
      const line = StreamJsonLineStub({
        value: JSON.stringify({
          type: 'assistant',
          message: {
            content: [null],
          },
        }),
      });

      const result = streamJsonToTextTransformer({ line });

      expect(result).toBeNull();
    });

    it('EMPTY: {content item is primitive} => returns null', () => {
      const line = StreamJsonLineStub({
        value: JSON.stringify({
          type: 'assistant',
          message: {
            content: ['not an object'],
          },
        }),
      });

      const result = streamJsonToTextTransformer({ line });

      expect(result).toBeNull();
    });
  });

  describe('invalid JSON handling', () => {
    it('ERROR: {invalid JSON} => returns null', () => {
      const line = StreamJsonLineStub({
        value: 'not valid json',
      });

      const result = streamJsonToTextTransformer({ line });

      expect(result).toBeNull();
    });

    it('ERROR: {truncated JSON} => returns null', () => {
      const line = StreamJsonLineStub({
        value: '{"type":"assistant"',
      });

      const result = streamJsonToTextTransformer({ line });

      expect(result).toBeNull();
    });
  });
});
