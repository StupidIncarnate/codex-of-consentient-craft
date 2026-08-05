import { commentBatchResponseContract } from './comment-batch-response-contract';
import { CommentBatchResponseStub } from './comment-batch-response.stub';

describe('commentBatchResponseContract', () => {
  describe('valid responses', () => {
    it('VALID: {default stub} => parses a chatProcessId and the delivered markdown', () => {
      const result = CommentBatchResponseStub();

      expect(result).toStrictEqual({
        chatProcessId: 'proc-12345',
        deliveredMessage:
          'Flow "Login Flow" / node `login-page` ("Login Page")\nUser Comment: This copy is wrong',
      });
    });

    it('VALID: {chatProcessId: proc-67890} => parses an overridden chatProcessId', () => {
      const result = CommentBatchResponseStub({ chatProcessId: 'proc-67890' });

      expect(result).toStrictEqual({
        chatProcessId: 'proc-67890',
        deliveredMessage:
          'Flow "Login Flow" / node `login-page` ("Login Page")\nUser Comment: This copy is wrong',
      });
    });

    it('VALID: {deliveredMessage: two-block batch} => parses an overridden deliveredMessage', () => {
      const result = CommentBatchResponseStub({
        deliveredMessage:
          'Flow "Login Flow" / node `start` ("Start")\nUser Comment: First\n\n---\n\nFlow "Login Flow" / node `finish` ("Finish")\nUser Comment: Second',
      });

      expect(result).toStrictEqual({
        chatProcessId: 'proc-12345',
        deliveredMessage:
          'Flow "Login Flow" / node `start` ("Start")\nUser Comment: First\n\n---\n\nFlow "Login Flow" / node `finish` ("Finish")\nUser Comment: Second',
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
        commentBatchResponseContract.parse({
          chatProcessId: '',
          deliveredMessage: 'User Comment: This copy is wrong',
        });
      }).toThrow(/String must contain at least 1 character/u);
    });

    it('INVALID: {missing deliveredMessage} => throws validation error', () => {
      expect(() => {
        commentBatchResponseContract.parse({ chatProcessId: 'proc-12345' });
      }).toThrow(/Required/u);
    });

    it('EMPTY: {deliveredMessage: ""} => throws validation error', () => {
      expect(() => {
        commentBatchResponseContract.parse({ chatProcessId: 'proc-12345', deliveredMessage: '' });
      }).toThrow(/String must contain at least 1 character/u);
    });
  });
});
