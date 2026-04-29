import { assistantStreamLineContract } from './assistant-stream-line-contract';
import {
  AssistantAskUserQuestionStreamLineStub,
  AssistantMixedContentStreamLineStub,
  AssistantMixedTextThinkingStreamLineStub,
  AssistantMixedToolUseToolResultStreamLineStub,
  AssistantNullStopReasonStreamLineStub,
  AssistantReadToolUseStreamLineStub,
  AssistantRedactedThinkingStreamLineStub,
  AssistantTaskToolUseStreamLineStub,
  AssistantTextStreamLineStub,
  AssistantThinkingStreamLineStub,
  AssistantThinkingWithSignatureStreamLineStub,
  AssistantToolResultArrayContentStreamLineStub,
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

    it('VALID: {redacted_thinking content} => parses redacted_thinking block with data field', () => {
      const streamLine = AssistantRedactedThinkingStreamLineStub();

      const result = assistantStreamLineContract.parse(streamLine);

      expect(result).toStrictEqual({
        type: 'assistant',
        message: {
          role: 'assistant',
          content: [
            {
              type: 'redacted_thinking',
              data: 'EtQCClkIDBgCKkDr4oLptwx6b6TDFpBewoaZg35pJ2vjLn2mMCK4mi+redactedblob',
            },
          ],
        },
      });
    });

    it('VALID: {tool_result with array content} => parses tool_result carrying a content block array', () => {
      const streamLine = AssistantToolResultArrayContentStreamLineStub();

      const result = assistantStreamLineContract.parse(streamLine);

      expect(result).toStrictEqual({
        type: 'assistant',
        message: {
          role: 'assistant',
          content: [
            {
              type: 'tool_result',
              tool_use_id: 'toolu_01ArrayResult7890abcd',
              content: [{ type: 'text', text: 'line one\nline two' }],
            },
          ],
        },
      });
    });

    it('VALID: {thinking with signature} => parses thinking block with non-empty signature field', () => {
      const streamLine = AssistantThinkingWithSignatureStreamLineStub();

      const result = assistantStreamLineContract.parse(streamLine);

      expect(result).toStrictEqual({
        type: 'assistant',
        message: {
          role: 'assistant',
          content: [
            {
              type: 'thinking',
              thinking: 'I need to reason through the architecture carefully before proceeding.',
              signature: 'EtQCClkIDBgCKkDr4oLptwx6b6TDFpBewoaZg35pJ2vjLn2mMCK4mi+sigblob',
            },
          ],
        },
      });
    });

    it('VALID: {mixed text + thinking} => parses thinking and text blocks in same content array', () => {
      const streamLine = AssistantMixedTextThinkingStreamLineStub();

      const result = assistantStreamLineContract.parse(streamLine);

      expect(result).toStrictEqual({
        type: 'assistant',
        message: {
          role: 'assistant',
          content: [
            { type: 'thinking', thinking: 'Let me think about the best approach here.' },
            {
              type: 'text',
              text: 'Based on my analysis, the best approach is to refactor the broker.',
            },
          ],
        },
      });
    });

    it('VALID: {mixed tool_use + tool_result} => parses tool_use and tool_result in same content array', () => {
      const streamLine = AssistantMixedToolUseToolResultStreamLineStub();

      const result = assistantStreamLineContract.parse(streamLine);

      expect(result).toStrictEqual({
        type: 'assistant',
        message: {
          role: 'assistant',
          content: [
            {
              type: 'tool_use',
              id: 'toolu_01MixedUse7890abcd',
              name: 'Bash',
              input: { command: 'cat /tmp/output.txt' },
            },
            {
              type: 'tool_result',
              tool_use_id: 'toolu_01MixedUse7890abcd',
              content: 'output line one\noutput line two',
            },
          ],
        },
      });
    });
  });

  describe('regression: Claude CLI null stop_reason on streamed deltas', () => {
    it('VALID: {stop_reason: null} => parses assistant line with explicit null stop_reason', () => {
      const streamLine = AssistantNullStopReasonStreamLineStub();

      const result = assistantStreamLineContract.parse(streamLine);

      expect(result.message.stop_reason).toBe(null);
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

    it('INVALID: {content item with unknown type "server_tool_use"} => throws invalid discriminator', () => {
      expect(() => {
        assistantStreamLineContract.parse({
          type: 'assistant',
          message: {
            role: 'assistant',
            content: [{ type: 'server_tool_use', id: 'toolu_01', name: 'web_search', input: {} }],
          },
        });
      }).toThrow(/Invalid discriminator value/u);
    });

    it('INVALID: {thinking block missing thinking field} => throws required error', () => {
      expect(() => {
        assistantStreamLineContract.parse({
          type: 'assistant',
          message: {
            role: 'assistant',
            content: [{ type: 'thinking' }],
          },
        });
      }).toThrow(/Required/u);
    });

    it('INVALID: {tool_use block missing id} => throws validation error for missing id', () => {
      expect(() => {
        assistantStreamLineContract.parse({
          type: 'assistant',
          message: {
            role: 'assistant',
            content: [{ type: 'tool_use', name: 'Bash', input: {} }],
          },
        });
      }).toThrow(/Required|too_small/u);
    });

    it('INVALID: {tool_result block missing tool_use_id} => throws validation error for missing tool_use_id', () => {
      expect(() => {
        assistantStreamLineContract.parse({
          type: 'assistant',
          message: {
            role: 'assistant',
            content: [{ type: 'tool_result', content: 'some output' }],
          },
        });
      }).toThrow(/Required|too_small/u);
    });

    it('INVALID: {redacted_thinking block missing data field} => throws required error', () => {
      expect(() => {
        assistantStreamLineContract.parse({
          type: 'assistant',
          message: {
            role: 'assistant',
            content: [{ type: 'redacted_thinking' }],
          },
        });
      }).toThrow(/Required/u);
    });

    it('INVALID: {text block missing text field} => throws required error', () => {
      expect(() => {
        assistantStreamLineContract.parse({
          type: 'assistant',
          message: {
            role: 'assistant',
            content: [{ type: 'text' }],
          },
        });
      }).toThrow(/Required/u);
    });
  });
});
