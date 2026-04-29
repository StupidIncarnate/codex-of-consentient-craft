import {
  DocumentArrayToolResultStreamLineStub,
  ImageArrayToolResultStreamLineStub,
  MixedArrayToolResultStreamLineStub,
  MixedTextAndToolResultStreamLineStub,
  PermissionDeniedStreamLineStub,
  SearchResultArrayToolResultStreamLineStub,
  SuccessfulToolResultStreamLineStub,
  TextOnlyUserStreamLineStub,
  ToolReferenceArrayToolResultStreamLineStub,
  UserTextStringStreamLineStub,
} from '@dungeonmaster/shared/contracts';
import { snakeKeysToCamelKeysTransformer } from '@dungeonmaster/shared/transformers';
import { parseUserStreamEntryTransformer } from './parse-user-stream-entry-transformer';

const normalize = (value: unknown): object => snakeKeysToCamelKeysTransformer({ value }) as object;

describe('parseUserStreamEntryTransformer', () => {
  describe('tool_result content', () => {
    it('VALID: {permission denied tool result} => returns tool result entry with isError', () => {
      const result = parseUserStreamEntryTransformer({
        parsed: normalize(PermissionDeniedStreamLineStub()),
      });

      expect(result).toStrictEqual([
        {
          role: 'assistant',
          type: 'tool_result',
          toolName: 'toolu_016sbUuxidMBZVMKM9jpHsqK',
          content:
            "Claude requested permissions to use mcp__dungeonmaster__list-guilds, but you haven't granted it yet.",
          isError: true,
        },
      ]);
    });

    it('VALID: {successful tool result} => returns tool result entry without isError', () => {
      const result = parseUserStreamEntryTransformer({
        parsed: normalize(SuccessfulToolResultStreamLineStub()),
      });

      expect(result).toStrictEqual([
        {
          role: 'assistant',
          type: 'tool_result',
          toolName: 'toolu_01EaCJyt5y8gzMNyGYarwUDZ',
          content: 'File contents retrieved successfully',
        },
      ]);
    });

    it('VALID: {mixed text and tool result} => only returns tool_result entries', () => {
      const result = parseUserStreamEntryTransformer({
        parsed: normalize(MixedTextAndToolResultStreamLineStub()),
      });

      expect(result).toStrictEqual([
        {
          role: 'assistant',
          type: 'tool_result',
          toolName: 'toolu_015sb5Rz8yPMN4sbwdNaz8kk',
          content: 'Read 42 lines from file',
        },
      ]);
    });

    it('VALID: {tool_reference array content} => returns tool_result entry with empty content (tool_reference items have no text field)', () => {
      const result = parseUserStreamEntryTransformer({
        parsed: normalize(ToolReferenceArrayToolResultStreamLineStub()),
      });

      expect(result).toStrictEqual([
        {
          role: 'assistant',
          type: 'tool_result',
          toolName: 'toolu_01ToolSearch1234abcd',
          content: '',
        },
      ]);
    });

    it('VALID: {image array content} => returns tool_result entry with empty content (image items have no text field)', () => {
      const result = parseUserStreamEntryTransformer({
        parsed: normalize(ImageArrayToolResultStreamLineStub()),
      });

      expect(result).toStrictEqual([
        {
          role: 'assistant',
          type: 'tool_result',
          toolName: 'toolu_01Screenshot5678efgh',
          content: '',
        },
      ]);
    });

    it('VALID: {document array content} => returns tool_result entry with empty content (document items have no text field)', () => {
      const result = parseUserStreamEntryTransformer({
        parsed: normalize(DocumentArrayToolResultStreamLineStub()),
      });

      expect(result).toStrictEqual([
        {
          role: 'assistant',
          type: 'tool_result',
          toolName: 'toolu_01DocFetch9012ijkl',
          content: '',
        },
      ]);
    });

    it('VALID: {search_result array content} => returns tool_result entry with empty content (search_result items have no top-level text field)', () => {
      const result = parseUserStreamEntryTransformer({
        parsed: normalize(SearchResultArrayToolResultStreamLineStub()),
      });

      expect(result).toStrictEqual([
        {
          role: 'assistant',
          type: 'tool_result',
          toolName: 'toolu_01WebSearch3456mnop',
          content: '',
        },
      ]);
    });

    it('VALID: {mixed text+tool_reference array content} => returns tool_result entry with only text items joined', () => {
      const result = parseUserStreamEntryTransformer({
        parsed: normalize(MixedArrayToolResultStreamLineStub()),
      });

      expect(result).toStrictEqual([
        {
          role: 'assistant',
          type: 'tool_result',
          toolName: 'toolu_01MixedArray7890qrst',
          content: 'Found the following tools:',
        },
      ]);
    });
  });

  describe('source and agentId propagation', () => {
    it('VALID: {entry with source and agentId} => propagates to tool_result entries', () => {
      const result = parseUserStreamEntryTransformer({
        parsed: normalize({
          type: 'user',
          source: 'session',
          agentId: 'agent-42',
          message: {
            content: [{ type: 'tool_result', tool_use_id: 'toolu_abc', content: 'done' }],
          },
        }),
      });

      expect(result).toStrictEqual([
        {
          role: 'assistant',
          type: 'tool_result',
          toolName: 'toolu_abc',
          content: 'done',
          source: 'session',
          agentId: 'agent-42',
        },
      ]);
    });
  });

  describe('edge cases', () => {
    it('EDGE: {no message field} => returns empty array', () => {
      const stub = normalize(TextOnlyUserStreamLineStub());
      Reflect.deleteProperty(stub, 'message');

      const result = parseUserStreamEntryTransformer({ parsed: stub });

      expect(result).toStrictEqual([]);
    });

    it('EDGE: {message is null} => returns empty array', () => {
      const result = parseUserStreamEntryTransformer({
        parsed: { type: 'user', message: null },
      });

      expect(result).toStrictEqual([]);
    });

    it('VALID: {content is plain string} => returns user entry', () => {
      const result = parseUserStreamEntryTransformer({
        parsed: normalize(
          UserTextStringStreamLineStub({
            message: { role: 'user', content: 'plain string without tool results' },
          }),
        ),
      });

      expect(result).toStrictEqual([
        {
          role: 'user',
          content: 'plain string without tool results',
        },
      ]);
    });

    it('EDGE: {text only user message with array content} => returns empty array', () => {
      const result = parseUserStreamEntryTransformer({
        parsed: normalize(TextOnlyUserStreamLineStub()),
      });

      expect(result).toStrictEqual([]);
    });

    it('EDGE: {content array has null item} => skips null items', () => {
      const result = parseUserStreamEntryTransformer({
        parsed: normalize({
          type: 'user',
          message: {
            content: [null, { type: 'tool_result', tool_use_id: 'toolu_abc', content: 'data' }],
          },
        }),
      });

      expect(result).toStrictEqual([
        {
          role: 'assistant',
          type: 'tool_result',
          toolName: 'toolu_abc',
          content: 'data',
        },
      ]);
    });

    it('EDGE: {content item without type field} => skips item', () => {
      const result = parseUserStreamEntryTransformer({
        parsed: normalize({
          type: 'user',
          message: {
            content: [{ tool_use_id: 'toolu_abc', content: 'data' }],
          },
        }),
      });

      expect(result).toStrictEqual([]);
    });

    it('EDGE: {content item with non-tool_result type} => skips non-tool_result items', () => {
      const result = parseUserStreamEntryTransformer({
        parsed: normalize({
          type: 'user',
          message: {
            content: [{ type: 'text', text: 'hello' }],
          },
        }),
      });

      expect(result).toStrictEqual([]);
    });
  });
});
