import {
  AssistantTextStreamLineStub,
  AssistantToolResultStreamLineStub,
  AssistantToolUseStreamLineStub,
  AssistantMixedContentStreamLineStub,
  MixedTextAndToolResultStreamLineStub,
  PermissionDeniedStreamLineStub,
  ResultStreamLineStub,
  SuccessfulToolResultStreamLineStub,
  SystemInitStreamLineStub,
  TextOnlyUserStreamLineStub,
  UserTextStringStreamLineStub,
} from '@dungeonmaster/shared/contracts';
import { streamJsonToChatEntryTransformer } from './stream-json-to-chat-entry-transformer';

describe('streamJsonToChatEntryTransformer', () => {
  describe('system init messages', () => {
    it('VALID: {type: "system", subtype: "init", session_id} => returns empty entries with session ID', () => {
      const line = JSON.stringify(SystemInitStreamLineStub({ session_id: 'sess-abc-123' }));

      const result = streamJsonToChatEntryTransformer({ line });

      expect(result).toStrictEqual({
        entries: [],
        sessionId: 'sess-abc-123',
      });
    });
  });

  describe('assistant messages', () => {
    it('VALID: {type: "assistant", text content} => returns text chat entry', () => {
      const stub = AssistantTextStreamLineStub({
        message: {
          role: 'assistant',
          content: [{ type: 'text', text: 'Hello world' }],
          usage: { input_tokens: 100, output_tokens: 50 },
        },
      });
      const line = JSON.stringify({
        ...stub,
        message: {
          ...stub.message,
          usage: {
            ...stub.message.usage,
            cache_creation_input_tokens: 10,
            cache_read_input_tokens: 5,
          },
        },
      });

      const result = streamJsonToChatEntryTransformer({ line });

      expect(result).toStrictEqual({
        entries: [
          {
            role: 'assistant',
            type: 'text',
            content: 'Hello world',
            usage: {
              inputTokens: 100,
              outputTokens: 50,
              cacheCreationInputTokens: 10,
              cacheReadInputTokens: 5,
            },
          },
        ],
        sessionId: null,
      });
    });

    it('VALID: {type: "assistant", tool_use content} => returns tool use chat entry', () => {
      const line = JSON.stringify(
        AssistantToolUseStreamLineStub({
          message: {
            role: 'assistant',
            content: [{ type: 'tool_use', name: 'read_file', input: { path: '/test' } }],
          },
        }),
      );

      const result = streamJsonToChatEntryTransformer({ line });

      expect(result).toStrictEqual({
        entries: [
          {
            role: 'assistant',
            type: 'tool_use',
            toolName: 'read_file',
            toolInput: '{"path":"/test"}',
          },
        ],
        sessionId: null,
      });
    });

    it('VALID: {type: "assistant", tool_result content} => returns tool result chat entry', () => {
      const line = JSON.stringify(
        AssistantToolResultStreamLineStub({
          message: {
            role: 'assistant',
            content: [{ type: 'tool_result', tool_use_id: 'toolu_123', content: 'file data' }],
          },
        }),
      );

      const result = streamJsonToChatEntryTransformer({ line });

      expect(result).toStrictEqual({
        entries: [
          {
            role: 'assistant',
            type: 'tool_result',
            toolName: 'toolu_123',
            content: 'file data',
          },
        ],
        sessionId: null,
      });
    });

    it('VALID: {type: "assistant", multiple content items} => returns multiple entries', () => {
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
      const line = JSON.stringify({
        ...stub,
        message: {
          ...stub.message,
          usage: {
            ...stub.message.usage,
            cache_creation_input_tokens: 0,
            cache_read_input_tokens: 0,
          },
        },
      });

      const result = streamJsonToChatEntryTransformer({ line });

      expect(result).toStrictEqual({
        entries: [
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
        ],
        sessionId: null,
      });
    });

    it('EDGE: {type: "assistant", no message} => returns empty entries', () => {
      const line = JSON.stringify({ type: 'assistant' });

      const result = streamJsonToChatEntryTransformer({ line });

      expect(result).toStrictEqual({
        entries: [],
        sessionId: null,
      });
    });

    it('EDGE: {type: "assistant", content not array} => returns empty entries', () => {
      const line = JSON.stringify({
        type: 'assistant',
        message: { content: 'not-an-array' },
      });

      const result = streamJsonToChatEntryTransformer({ line });

      expect(result).toStrictEqual({
        entries: [],
        sessionId: null,
      });
    });

    it('EDGE: {type: "assistant", unrecognized content item} => skips unknown items', () => {
      const line = JSON.stringify({
        type: 'assistant',
        message: {
          content: [{ type: 'unknown_type' }],
        },
      });

      const result = streamJsonToChatEntryTransformer({ line });

      expect(result).toStrictEqual({
        entries: [],
        sessionId: null,
      });
    });
  });

  describe('user messages with tool_result', () => {
    it('VALID: {permission denied tool result} => returns tool result entry with isError', () => {
      const streamLine = PermissionDeniedStreamLineStub();
      const line = JSON.stringify(streamLine);

      const result = streamJsonToChatEntryTransformer({ line });

      expect(result).toStrictEqual({
        entries: [
          {
            role: 'assistant',
            type: 'tool_result',
            toolName: 'toolu_016sbUuxidMBZVMKM9jpHsqK',
            content:
              "Claude requested permissions to use mcp__dungeonmaster__list-guilds, but you haven't granted it yet.",
            isError: true,
          },
        ],
        sessionId: null,
      });
    });

    it('VALID: {successful tool result} => returns tool result entry without isError', () => {
      const streamLine = SuccessfulToolResultStreamLineStub();
      const line = JSON.stringify(streamLine);

      const result = streamJsonToChatEntryTransformer({ line });

      expect(result).toStrictEqual({
        entries: [
          {
            role: 'assistant',
            type: 'tool_result',
            toolName: 'toolu_01EaCJyt5y8gzMNyGYarwUDZ',
            content: 'File contents retrieved successfully',
          },
        ],
        sessionId: null,
      });
    });

    it('VALID: {mixed text and tool result} => only returns tool_result entries', () => {
      const streamLine = MixedTextAndToolResultStreamLineStub();
      const line = JSON.stringify(streamLine);

      const result = streamJsonToChatEntryTransformer({ line });

      expect(result).toStrictEqual({
        entries: [
          {
            role: 'assistant',
            type: 'tool_result',
            toolName: 'toolu_015sb5Rz8yPMN4sbwdNaz8kk',
            content: 'Read 42 lines from file',
          },
        ],
        sessionId: null,
      });
    });

    it('EDGE: {type: "user", no message} => returns empty entries', () => {
      const line = JSON.stringify({ type: 'user' });

      const result = streamJsonToChatEntryTransformer({ line });

      expect(result).toStrictEqual({
        entries: [],
        sessionId: null,
      });
    });

    it('EDGE: {type: "user", content is plain string} => returns empty entries', () => {
      const line = JSON.stringify(
        UserTextStringStreamLineStub({
          message: { role: 'user', content: 'plain string without tool results' },
        }),
      );

      const result = streamJsonToChatEntryTransformer({ line });

      expect(result).toStrictEqual({
        entries: [],
        sessionId: null,
      });
    });

    it('EDGE: {text only user message} => returns empty entries', () => {
      const streamLine = TextOnlyUserStreamLineStub();
      const line = JSON.stringify(streamLine);

      const result = streamJsonToChatEntryTransformer({ line });

      expect(result).toStrictEqual({
        entries: [],
        sessionId: null,
      });
    });
  });

  describe('result messages', () => {
    it('VALID: {type: "result", session_id} => returns empty entries with session ID', () => {
      const line = JSON.stringify(ResultStreamLineStub({ session_id: 'sess-xyz-789' }));

      const result = streamJsonToChatEntryTransformer({ line });

      expect(result).toStrictEqual({
        entries: [],
        sessionId: 'sess-xyz-789',
      });
    });
  });

  describe('unrecognized messages', () => {
    it('EDGE: {type: "unknown"} => returns empty result', () => {
      const line = JSON.stringify({ type: 'unknown' });

      const result = streamJsonToChatEntryTransformer({ line });

      expect(result).toStrictEqual({
        entries: [],
        sessionId: null,
      });
    });

    it('EDGE: {no type field} => returns empty result', () => {
      const line = JSON.stringify({ data: 'something' });

      const result = streamJsonToChatEntryTransformer({ line });

      expect(result).toStrictEqual({
        entries: [],
        sessionId: null,
      });
    });
  });
});
