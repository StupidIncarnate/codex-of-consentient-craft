import { assistantStreamLineContract } from './assistant-stream-line-contract';
import {
  AssistantAskUserQuestionStreamLineStub,
  AssistantMixedContentStreamLineStub,
  AssistantReadToolUseStreamLineStub,
  AssistantRedactedThinkingStreamLineStub,
  AssistantTaskToolUseStreamLineStub,
  AssistantTextStreamLineStub,
  AssistantThinkingStreamLineStub,
  AssistantToolResultStreamLineStub,
  AssistantToolUseStreamLineStub,
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

      expect(result.message.usage).toBe(undefined);
    });

    it('VALID: {Task tool_use content} => parses Task dispatch with description, prompt, subagent_type', () => {
      const streamLine = AssistantTaskToolUseStreamLineStub();

      const result = assistantStreamLineContract.parse(streamLine);

      expect(result).toStrictEqual({
        type: 'assistant',
        message: {
          role: 'assistant',
          content: [
            {
              type: 'tool_use',
              id: 'toolu_01TaskDispatch7890abcd',
              name: 'Task',
              input: {
                description: 'Explore the auth flow',
                prompt: 'Research the auth system and report back with file paths and purposes.',
                subagent_type: 'Explore',
              },
            },
          ],
        },
      });
    });

    it('VALID: {ask-user-question tool_use} => parses MCP clarification invocation', () => {
      const streamLine = AssistantAskUserQuestionStreamLineStub();

      const result = assistantStreamLineContract.parse(streamLine);

      expect(result).toStrictEqual({
        type: 'assistant',
        message: {
          role: 'assistant',
          content: [
            {
              type: 'tool_use',
              id: 'toolu_01AskUserQuestion7890',
              name: 'mcp__dungeonmaster__ask-user-question',
              input: {
                questions: [
                  {
                    question: 'Which database do you want to use?',
                    header: 'Database Selection',
                    options: [
                      {
                        label: 'PostgreSQL',
                        description: 'Relational database with JSONB support',
                      },
                      { label: 'SQLite', description: 'Lightweight file-based database' },
                    ],
                    multiSelect: false,
                  },
                ],
              },
            },
          ],
        },
      });
    });

    it('VALID: {Read tool_use content} => parses Read invocation with file_path', () => {
      const streamLine = AssistantReadToolUseStreamLineStub();

      const result = assistantStreamLineContract.parse(streamLine);

      expect(result).toStrictEqual({
        type: 'assistant',
        message: {
          role: 'assistant',
          content: [
            {
              type: 'tool_use',
              id: 'toolu_01ReadFile7890abcd',
              name: 'Read',
              input: { file_path: '/src/index.ts' },
            },
          ],
        },
      });
    });

    it('VALID: {redacted thinking content} => parses thinking block with empty text (contract strips unknown signature field)', () => {
      const streamLine = AssistantRedactedThinkingStreamLineStub();

      const result = assistantStreamLineContract.parse(streamLine);

      expect(result).toStrictEqual({
        type: 'assistant',
        message: {
          role: 'assistant',
          content: [{ type: 'thinking', thinking: '' }],
        },
      });
    });
  });

  describe('invalid stream lines', () => {
    it('INVALID: {type: "user"} => throws validation error', () => {
      expect(() => {
        assistantStreamLineContract.parse({
          type: 'user',
          message: { role: 'assistant', content: [] },
        });
      }).toThrow(/Invalid literal value/u);
    });

    it('INVALID: {no message field} => throws validation error', () => {
      expect(() => {
        assistantStreamLineContract.parse({
          type: 'assistant',
        });
      }).toThrow(/Required/u);
    });

    it('INVALID: {message without content array} => throws validation error', () => {
      expect(() => {
        assistantStreamLineContract.parse({
          type: 'assistant',
          message: { role: 'assistant' },
        });
      }).toThrow(/Required/u);
    });
  });
});
