import { assistantStreamLineContract } from './assistant-stream-line-contract';
import {
  AssistantTextStreamLineStub,
  AssistantToolUseStreamLineStub,
  AssistantToolResultStreamLineStub,
  AssistantMixedContentStreamLineStub,
  AssistantThinkingStreamLineStub,
} from './assistant-stream-line.stub';

describe('assistantStreamLineContract', () => {
  describe('valid stream lines', () => {
    it('VALID: {text content} => parses assistant text message', () => {
      const streamLine = AssistantTextStreamLineStub();

      const result = assistantStreamLineContract.parse(streamLine);

      expect(result).toStrictEqual({
        type: 'assistant',
        message: {
          role: 'assistant',
          content: [{ type: 'text', text: 'Hello, I can help with that.' }],
        },
      });
    });

    it('VALID: {tool_use content} => parses tool invocation with id, name, input', () => {
      const streamLine = AssistantToolUseStreamLineStub();

      const result = assistantStreamLineContract.parse(streamLine);

      expect(result).toStrictEqual({
        type: 'assistant',
        message: {
          role: 'assistant',
          content: [
            {
              type: 'tool_use',
              id: 'toolu_01EaCJyt5y8gzMNyGYarwUDZ',
              name: 'Bash',
              input: { command: 'ls -la' },
            },
          ],
        },
      });
    });

    it('VALID: {tool_result content} => parses tool result with tool_use_id', () => {
      const streamLine = AssistantToolResultStreamLineStub();

      const result = assistantStreamLineContract.parse(streamLine);

      expect(result).toStrictEqual({
        type: 'assistant',
        message: {
          role: 'assistant',
          content: [
            {
              type: 'tool_result',
              tool_use_id: 'toolu_01EaCJyt5y8gzMNyGYarwUDZ',
              content: 'file1.ts\nfile2.ts',
            },
          ],
        },
      });
    });

    it('VALID: {mixed text + tool_use with usage} => parses multiple content items and usage stats', () => {
      const streamLine = AssistantMixedContentStreamLineStub();

      const result = assistantStreamLineContract.parse(streamLine);

      expect(result).toStrictEqual({
        type: 'assistant',
        message: {
          role: 'assistant',
          content: [
            { type: 'text', text: 'Let me check that file.' },
            {
              type: 'tool_use',
              id: 'toolu_01XYZ',
              name: 'Read',
              input: { file_path: '/src/index.ts' },
            },
          ],
          usage: { input_tokens: 100, output_tokens: 50 },
        },
      });
    });

    it('VALID: {thinking content} => parses thinking block', () => {
      const streamLine = AssistantThinkingStreamLineStub();

      const result = assistantStreamLineContract.parse(streamLine);

      expect(result).toStrictEqual({
        type: 'assistant',
        message: {
          role: 'assistant',
          content: [
            { type: 'thinking', thinking: 'I need to consider the user request carefully.' },
          ],
        },
      });
    });

    it('VALID: {stubs without usage} => usage is optional and omitted', () => {
      const streamLine = AssistantTextStreamLineStub();

      const result = assistantStreamLineContract.parse(streamLine);

      expect(result.message.usage).toBeUndefined();
    });
  });

  describe('invalid stream lines', () => {
    it('INVALID_TYPE: {type: "user"} => throws validation error', () => {
      expect(() => {
        assistantStreamLineContract.parse({
          type: 'user',
          message: { role: 'assistant', content: [] },
        });
      }).toThrow(/Invalid literal value/u);
    });

    it('INVALID_MISSING_MESSAGE: {no message field} => throws validation error', () => {
      expect(() => {
        assistantStreamLineContract.parse({
          type: 'assistant',
        });
      }).toThrow(/Required/u);
    });

    it('INVALID_MISSING_CONTENT: {message without content array} => throws validation error', () => {
      expect(() => {
        assistantStreamLineContract.parse({
          type: 'assistant',
          message: { role: 'assistant' },
        });
      }).toThrow(/Required/u);
    });
  });
});
