import { userTextStreamLineContract } from './user-text-stream-line-contract';
import {
  TaskNotificationUserTextStreamLineStub,
  UserTextArrayStreamLineStub,
  UserTextStringStreamLineStub,
} from './user-text-stream-line.stub';

describe('userTextStreamLineContract', () => {
  describe('valid stream lines', () => {
    it('VALID: {string content} => parses user message with string content', () => {
      const streamLine = UserTextStringStreamLineStub();

      const result = userTextStreamLineContract.parse(streamLine);

      expect(result).toStrictEqual({
        type: 'user',
        message: {
          role: 'user',
          content: 'Hello',
        },
      });
    });

    it('VALID: {array content} => parses user message with array content', () => {
      const streamLine = UserTextArrayStreamLineStub();

      const result = userTextStreamLineContract.parse(streamLine);

      expect(result).toStrictEqual({
        type: 'user',
        message: {
          role: 'user',
          content: [{ type: 'text', text: 'Hello' }],
        },
      });
    });

    it('VALID: {task-notification string content} => parses full XML string as user message content', () => {
      const streamLine = TaskNotificationUserTextStreamLineStub();

      const result = userTextStreamLineContract.parse(streamLine);

      expect(result).toStrictEqual({
        type: 'user',
        message: {
          role: 'user',
          content: [
            '<task-notification>',
            '<task-id>acfc7f06a8ac21baf</task-id>',
            '<tool-use-id>toolu_01R7DU7d8xnhW2pSnw3T9bbx</tool-use-id>',
            '<status>completed</status>',
            '<summary>Agent "MCP calls test - background sub-agent" completed</summary>',
            '<result>Background agent B: made both MCP calls successfully.</result>',
            '<usage><total_tokens>28054</total_tokens><tool_uses>3</tool_uses><duration_ms>9033</duration_ms></usage>',
            '</task-notification>',
          ].join('\n'),
        },
      });
    });
  });

  describe('invalid stream lines', () => {
    it('INVALID: {type: "assistant"} => throws validation error', () => {
      expect(() => {
        userTextStreamLineContract.parse({
          type: 'assistant',
          message: { role: 'user', content: 'Hello' },
        });
      }).toThrow(/Invalid literal value/u);
    });

    it('INVALID: {role: "assistant"} => throws validation error', () => {
      expect(() => {
        userTextStreamLineContract.parse({
          type: 'user',
          message: { role: 'assistant', content: 'Hello' },
        });
      }).toThrow(/Invalid literal value/u);
    });

    it('INVALID: {missing message} => throws validation error', () => {
      expect(() => {
        userTextStreamLineContract.parse({
          type: 'user',
        });
      }).toThrow(/Required/u);
    });
  });
});
