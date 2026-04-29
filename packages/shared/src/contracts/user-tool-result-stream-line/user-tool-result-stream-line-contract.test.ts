import { userToolResultStreamLineContract } from './user-tool-result-stream-line-contract';
import {
  AskUserQuestionToolResultStreamLineStub,
  DocumentArrayToolResultStreamLineStub,
  ImageArrayToolResultStreamLineStub,
  McpTextReturnToolResultStreamLineStub,
  MixedArrayToolResultStreamLineStub,
  MixedTextAndToolResultStreamLineStub,
  PermissionDeniedStreamLineStub,
  ReadTooBigErrorToolResultStreamLineStub,
  SearchResultArrayToolResultStreamLineStub,
  SuccessfulToolResultStreamLineStub,
  TaskToolResultStreamLineStub,
  TextOnlyUserStreamLineStub,
  ToolReferenceArrayToolResultStreamLineStub,
} from './user-tool-result-stream-line.stub';

describe('userToolResultStreamLineContract', () => {
  describe('valid stream lines — string content', () => {
    it('VALID: {permission denied tool result} => parses with is_error true', () => {
      const streamLine = PermissionDeniedStreamLineStub();

      const result = userToolResultStreamLineContract.parse(streamLine);

      expect(result).toStrictEqual({
        type: 'user',
        message: {
          role: 'user',
          content: [
            {
              type: 'tool_result',
              tool_use_id: 'toolu_016sbUuxidMBZVMKM9jpHsqK',
              content:
                "Claude requested permissions to use mcp__dungeonmaster__list-guilds, but you haven't granted it yet.",
              is_error: true,
            },
          ],
        },
      });
    });

    it('VALID: {successful tool result} => parses without is_error', () => {
      const streamLine = SuccessfulToolResultStreamLineStub();

      const result = userToolResultStreamLineContract.parse(streamLine);

      expect(result).toStrictEqual({
        type: 'user',
        message: {
          role: 'user',
          content: [
            {
              type: 'tool_result',
              tool_use_id: 'toolu_01EaCJyt5y8gzMNyGYarwUDZ',
              content: 'File contents retrieved successfully',
            },
          ],
        },
      });
    });

    it('VALID: {mixed text and tool result} => parses both content items', () => {
      const streamLine = MixedTextAndToolResultStreamLineStub();

      const result = userToolResultStreamLineContract.parse(streamLine);

      expect(result.message.content).toStrictEqual([
        {
          type: 'text',
          text: 'User follow-up message',
        },
        {
          type: 'tool_result',
          tool_use_id: 'toolu_015sb5Rz8yPMN4sbwdNaz8kk',
          content: 'Read 42 lines from file',
        },
      ]);
    });

    it('VALID: {text only user message} => parses with no tool results', () => {
      const streamLine = TextOnlyUserStreamLineStub();

      const result = userToolResultStreamLineContract.parse(streamLine);

      expect(result.message.content).toStrictEqual([
        {
          type: 'text',
          text: 'Just a user message',
        },
      ]);
    });

    it('VALID: {Task tool result with toolUseResult.agentId} => parses agentId correlation field', () => {
      const streamLine = TaskToolResultStreamLineStub();

      const result = userToolResultStreamLineContract.parse(streamLine);

      expect(result).toStrictEqual({
        type: 'user',
        message: {
          role: 'user',
          content: [
            {
              type: 'tool_result',
              tool_use_id: 'toolu_01TaskDispatch7890abcd',
              content: 'done',
            },
          ],
        },
        toolUseResult: { agentId: 'subagent-correlation-id' },
      });
    });

    it('VALID: {MCP / Bash text return with toolUseResult: array<text>} => parses array-shaped toolUseResult', () => {
      const streamLine = McpTextReturnToolResultStreamLineStub();

      const result = userToolResultStreamLineContract.parse(streamLine);

      expect(result).toStrictEqual({
        type: 'user',
        message: {
          role: 'user',
          content: [
            {
              type: 'tool_result',
              tool_use_id: 'toolu_01McpTextReturn5678',
              content: 'Quest contents here.',
            },
          ],
        },
        toolUseResult: [{ type: 'text', text: 'Quest contents here.' }],
      });
    });

    it('VALID: {Read-too-big error with toolUseResult: string} => parses string-shaped toolUseResult', () => {
      const streamLine = ReadTooBigErrorToolResultStreamLineStub();

      const result = userToolResultStreamLineContract.parse(streamLine);

      expect(result).toStrictEqual({
        type: 'user',
        message: {
          role: 'user',
          content: [
            {
              type: 'tool_result',
              tool_use_id: 'toolu_01ReadTooBig9012',
              content:
                'File content (42613 tokens) exceeds maximum allowed tokens (25000). Use offset and limit parameters to read specific portions of the file, or search for specific content instead of reading the whole file.',
              is_error: true,
            },
          ],
        },
        toolUseResult:
          'Error: File content (42613 tokens) exceeds maximum allowed tokens (25000). Use offset and limit parameters to read specific portions of the file, or search for specific content instead of reading the whole file.',
      });
    });

    it('VALID: {ask-user-question tool result} => parses MCP acknowledgement content', () => {
      const streamLine = AskUserQuestionToolResultStreamLineStub();

      const result = userToolResultStreamLineContract.parse(streamLine);

      expect(result).toStrictEqual({
        type: 'user',
        message: {
          role: 'user',
          content: [
            {
              type: 'tool_result',
              tool_use_id: 'toolu_01AskUserQuestion7890',
              content:
                'Questions sent to user. Their answers will arrive as your next user message.',
            },
          ],
        },
      });
    });
  });

  describe('valid stream lines — array content variants', () => {
    it('VALID: {tool_reference array content} => parses array of tool_reference blocks', () => {
      const streamLine = ToolReferenceArrayToolResultStreamLineStub();

      const result = userToolResultStreamLineContract.parse(streamLine);

      expect(result.message.content).toStrictEqual([
        {
          type: 'tool_result',
          tool_use_id: 'toolu_01ToolSearch1234abcd',
          content: [
            { type: 'tool_reference', tool_name: 'mcp__dungeonmaster__get-quest' },
            { type: 'tool_reference', tool_name: 'mcp__dungeonmaster__list-quests' },
          ],
        },
      ]);
    });

    it('VALID: {image array content} => parses array with image block', () => {
      const streamLine = ImageArrayToolResultStreamLineStub();

      const result = userToolResultStreamLineContract.parse(streamLine);

      expect(result.message.content).toStrictEqual([
        {
          type: 'tool_result',
          tool_use_id: 'toolu_01Screenshot5678efgh',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: 'image/png',
                data: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
              },
            },
          ],
        },
      ]);
    });

    it('VALID: {document array content} => parses array with document block', () => {
      const streamLine = DocumentArrayToolResultStreamLineStub();

      const result = userToolResultStreamLineContract.parse(streamLine);

      expect(result.message.content).toStrictEqual([
        {
          type: 'tool_result',
          tool_use_id: 'toolu_01DocFetch9012ijkl',
          content: [
            {
              type: 'document',
              source: {
                type: 'url',
                url: 'https://example.com/report.pdf',
              },
            },
          ],
        },
      ]);
    });

    it('VALID: {search_result array content} => parses array with search_result block', () => {
      const streamLine = SearchResultArrayToolResultStreamLineStub();

      const result = userToolResultStreamLineContract.parse(streamLine);

      expect(result.message.content).toStrictEqual([
        {
          type: 'tool_result',
          tool_use_id: 'toolu_01WebSearch3456mnop',
          content: [
            {
              type: 'search_result',
              source: 'https://example.com/article',
              title: 'Example Article Title',
              content: [{ type: 'text', text: 'The article content goes here.' }],
            },
          ],
        },
      ]);
    });

    it('VALID: {mixed text+tool_reference array content} => parses array with text and tool_reference blocks', () => {
      const streamLine = MixedArrayToolResultStreamLineStub();

      const result = userToolResultStreamLineContract.parse(streamLine);

      expect(result.message.content).toStrictEqual([
        {
          type: 'tool_result',
          tool_use_id: 'toolu_01MixedArray7890qrst',
          content: [
            { type: 'text', text: 'Found the following tools:' },
            { type: 'tool_reference', tool_name: 'mcp__dungeonmaster__discover' },
          ],
        },
      ]);
    });

    it('VALID: {tool_result with no content field} => parses without content', () => {
      const result = userToolResultStreamLineContract.parse({
        type: 'user',
        message: {
          role: 'user',
          content: [
            {
              type: 'tool_result',
              tool_use_id: 'toolu_01NoContent',
            },
          ],
        },
      });

      expect(result.message.content).toStrictEqual([
        {
          type: 'tool_result',
          tool_use_id: 'toolu_01NoContent',
        },
      ]);
    });
  });

  describe('invalid stream lines', () => {
    it('INVALID: {type: "assistant"} => throws validation error', () => {
      expect(() => {
        userToolResultStreamLineContract.parse({
          type: 'assistant',
          message: { role: 'user', content: [] },
        });
      }).toThrow(/Invalid literal value/u);
    });

    it('INVALID: {content item with unknown type discriminator} => throws validation error', () => {
      expect(() => {
        userToolResultStreamLineContract.parse({
          type: 'user',
          message: {
            role: 'user',
            content: [{ type: 'unknown_block_type', data: 'whatever' }],
          },
        });
      }).toThrow(/Invalid discriminator value/u);
    });

    it('INVALID: {tool_result content array item with unknown type} => throws validation error', () => {
      expect(() => {
        userToolResultStreamLineContract.parse({
          type: 'user',
          message: {
            role: 'user',
            content: [
              {
                type: 'tool_result',
                tool_use_id: 'toolu_01abc',
                content: [{ type: 'unknown_block', text: 'bad' }],
              },
            ],
          },
        });
      }).toThrow(/Invalid discriminator value/u);
    });

    it('INVALID: {tool_result missing tool_use_id} => throws validation error', () => {
      expect(() => {
        userToolResultStreamLineContract.parse({
          type: 'user',
          message: {
            role: 'user',
            content: [{ type: 'tool_result', content: 'some result' }],
          },
        });
      }).toThrow(/Required/u);
    });
  });
});
