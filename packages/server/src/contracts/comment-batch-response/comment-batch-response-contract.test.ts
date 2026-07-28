import { commentBatchResponseContract } from './comment-batch-response-contract';
import { CommentBatchResponseStub } from './comment-batch-response.stub';

describe('commentBatchResponseContract', () => {
  describe('valid responses', () => {
    it('VALID: {default stub} => parses a chatProcessId', () => {
      const result = CommentBatchResponseStub();

      expect(result).toStrictEqual({
        chatProcessId: 'proc-12345',
      });
    });

    it('VALID: {chatProcessId: proc-67890} => parses an overridden chatProcessId', () => {
      const result = CommentBatchResponseStub({ chatProcessId: 'proc-67890' });

      expect(result).toStrictEqual({
        chatProcessId: 'proc-67890',
      });
    });
  });

  describe('invalid responses', () => {
    it('INVALID: {missing chatProcessId} => throws validation error', () => {
      expect(() => {
        commentBatchResponseContract.parse({});
      }).toThrow(/Required/u);
    });

    it('EMPTY: {chatProcessId: ""} => throws validation error', () => {
      expect(() => {
        commentBatchResponseContract.parse({ chatProcessId: '' });
      }).toThrow(/String must contain at least 1 character/u);
    });
  });
});
