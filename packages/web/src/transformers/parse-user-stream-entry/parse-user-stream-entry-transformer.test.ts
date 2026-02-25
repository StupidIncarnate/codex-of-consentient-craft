import {
  PermissionDeniedStreamLineStub,
  SuccessfulToolResultStreamLineStub,
  MixedTextAndToolResultStreamLineStub,
  TextOnlyUserStreamLineStub,
  UserTextStringStreamLineStub,
} from '@dungeonmaster/shared/contracts';
import { parseUserStreamEntryTransformer } from './parse-user-stream-entry-transformer';

describe('parseUserStreamEntryTransformer', () => {
  describe('tool_result content', () => {
    it('VALID: {permission denied tool result} => returns tool result entry with isError', () => {
      const stub = PermissionDeniedStreamLineStub();

      const result = parseUserStreamEntryTransformer({ parsed: stub });

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
      const stub = SuccessfulToolResultStreamLineStub();

      const result = parseUserStreamEntryTransformer({ parsed: stub });

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
      const stub = MixedTextAndToolResultStreamLineStub();

      const result = parseUserStreamEntryTransformer({ parsed: stub });

      expect(result).toStrictEqual([
        {
          role: 'assistant',
          type: 'tool_result',
          toolName: 'toolu_015sb5Rz8yPMN4sbwdNaz8kk',
          content: 'Read 42 lines from file',
        },
      ]);
    });
  });

  describe('edge cases', () => {
    it('EDGE: {no message field} => returns empty array', () => {
      const stub = TextOnlyUserStreamLineStub();
      Reflect.deleteProperty(stub, 'message');

      const result = parseUserStreamEntryTransformer({ parsed: stub });

      expect(result).toStrictEqual([]);
    });

    it('EDGE: {content is plain string} => returns empty array', () => {
      const stub = UserTextStringStreamLineStub({
        message: { role: 'user', content: 'plain string without tool results' },
      });

      const result = parseUserStreamEntryTransformer({ parsed: stub });

      expect(result).toStrictEqual([]);
    });

    it('EDGE: {text only user message} => returns empty array', () => {
      const stub = TextOnlyUserStreamLineStub();

      const result = parseUserStreamEntryTransformer({ parsed: stub });

      expect(result).toStrictEqual([]);
    });
  });
});
