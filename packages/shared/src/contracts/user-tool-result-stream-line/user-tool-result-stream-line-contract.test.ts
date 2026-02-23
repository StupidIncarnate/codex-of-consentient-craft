import { userToolResultStreamLineContract } from './user-tool-result-stream-line-contract';
import {
  MixedTextAndToolResultStreamLineStub,
  PermissionDeniedStreamLineStub,
  SuccessfulToolResultStreamLineStub,
  TextOnlyUserStreamLineStub,
} from './user-tool-result-stream-line.stub';

describe('userToolResultStreamLineContract', () => {
  describe('valid stream lines', () => {
    it('VALID: {permission denied tool result} => parses with is_error true', () => {
      const streamLine = PermissionDeniedStreamLineStub();

      const result = userToolResultStreamLineContract.parse(streamLine);

      expect(result.type).toBe('user');
      expect(result.message.content).toStrictEqual([
        {
          type: 'tool_result',
          tool_use_id: 'toolu_016sbUuxidMBZVMKM9jpHsqK',
          content:
            "Claude requested permissions to use mcp__dungeonmaster__list-guilds, but you haven't granted it yet.",
          is_error: true,
        },
      ]);
    });

    it('VALID: {successful tool result} => parses without is_error', () => {
      const streamLine = SuccessfulToolResultStreamLineStub();

      const result = userToolResultStreamLineContract.parse(streamLine);

      expect(result.type).toBe('user');
      expect(result.message.content).toStrictEqual([
        {
          type: 'tool_result',
          tool_use_id: 'toolu_01EaCJyt5y8gzMNyGYarwUDZ',
          content: 'File contents retrieved successfully',
        },
      ]);
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
  });

  describe('invalid stream lines', () => {
    it('INVALID_TYPE: {type: "assistant"} => throws validation error', () => {
      expect(() => {
        userToolResultStreamLineContract.parse({
          type: 'assistant',
          message: { role: 'user', content: [] },
        });
      }).toThrow(/Invalid literal value/u);
    });
  });
});
