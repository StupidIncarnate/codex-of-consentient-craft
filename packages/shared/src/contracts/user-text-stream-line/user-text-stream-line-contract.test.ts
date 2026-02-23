import { userTextStreamLineContract } from './user-text-stream-line-contract';
import {
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
  });

  describe('invalid stream lines', () => {
    it('INVALID_TYPE: {type: "assistant"} => throws validation error', () => {
      expect(() => {
        userTextStreamLineContract.parse({
          type: 'assistant',
          message: { role: 'user', content: 'Hello' },
        });
      }).toThrow(/Invalid literal value/u);
    });

    it('INVALID_ROLE: {role: "assistant"} => throws validation error', () => {
      expect(() => {
        userTextStreamLineContract.parse({
          type: 'user',
          message: { role: 'assistant', content: 'Hello' },
        });
      }).toThrow(/Invalid literal value/u);
    });

    it('INVALID_MISSING: {missing message} => throws validation error', () => {
      expect(() => {
        userTextStreamLineContract.parse({
          type: 'user',
        });
      }).toThrow(/Required/u);
    });
  });
});
