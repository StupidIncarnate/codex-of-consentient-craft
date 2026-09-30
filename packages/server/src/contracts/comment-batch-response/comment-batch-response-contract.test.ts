import { commentBatchDeliveredContract } from './comment-batch-response-contract';
import { CommentBatchDeliveredStub } from './comment-batch-response.stub';

describe('commentBatchResponseContract', () => {
  describe('valid responses', () => {
    it('VALID: {default stub} => parses a chatProcessId and the delivered markdown', () => {
      const result = CommentBatchDeliveredStub();

      expect(result).toStrictEqual({
        chatProcessId: 'proc-12345',
        deliveredMessage:
          'Flow "Login Flow" / node `login-page` ("Login Page")\nUser Comment: This copy is wrong',
      });
    });

    it('VALID: {chatProcessId: proc-67890} => parses an overridden chatProcessId', () => {
      const result = CommentBatchDeliveredStub({ chatProcessId: 'proc-67890' });

      expect(result).toStrictEqual({
        chatProcessId: 'proc-67890',
        deliveredMessage:
          'Flow "Login Flow" / node `login-page` ("Login Page")\nUser Comment: This copy is wrong',
      });
    });

    it('VALID: {deliveredMessage: two-block batch} => parses an overridden deliveredMessage', () => {
      const result = CommentBatchDeliveredStub({
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
        commentBatchDeliveredContract.parse({});
      }).toThrow(/received undefined/u);
    });

    it('EMPTY: {chatProcessId: ""} => throws validation error', () => {
      expect(() => {
        commentBatchDeliveredContract.parse({
          chatProcessId: '',
          deliveredMessage: 'User Comment: This copy is wrong',
        });
      }).toThrow(/expected string to have >=1 characters/u);
    });

    it('INVALID: {missing deliveredMessage} => throws validation error', () => {
      expect(() => {
        commentBatchDeliveredContract.parse({ chatProcessId: 'proc-12345' });
      }).toThrow(/received undefined/u);
    });

    it('EMPTY: {deliveredMessage: ""} => throws validation error', () => {
      expect(() => {
        commentBatchDeliveredContract.parse({ chatProcessId: 'proc-12345', deliveredMessage: '' });
      }).toThrow(/expected string to have >=1 characters/u);
    });
  });
});
