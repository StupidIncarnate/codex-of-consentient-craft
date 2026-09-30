import { commentBatchReplyContract } from './comment-batch-reply-contract';
import { CommentBatchReplyStub } from './comment-batch-reply.stub';

describe('commentBatchReplyContract', () => {
  describe('valid bodies', () => {
    it('VALID: {chatProcessId only} => parses the 200 success shape', () => {
      const response = CommentBatchReplyStub({ chatProcessId: 'proc-comment-batch' });

      const result = commentBatchReplyContract.parse(response);

      expect(result).toStrictEqual({ chatProcessId: 'proc-comment-batch' });
    });

    it('VALID: {staleAnchors only} => parses the 409 denial shape', () => {
      const response = commentBatchReplyContract.parse({
        staleAnchors: [{ flowId: 'login-flow', nodeId: 'start' }],
      });

      expect(response).toStrictEqual({
        staleAnchors: [{ flowId: 'login-flow', nodeId: 'start' }],
      });
    });

    it('VALID: {error only} => parses the failure shape', () => {
      const response = commentBatchReplyContract.parse({ error: 'Quest write failed' });

      expect(response).toStrictEqual({ error: 'Quest write failed' });
    });

    it('EMPTY: {} => parses with every field absent', () => {
      const response = commentBatchReplyContract.parse({});

      expect(response).toStrictEqual({});
    });
  });

  describe('invalid bodies', () => {
    it('INVALID: {chatProcessId: ""} => throws validation error', () => {
      expect(() => commentBatchReplyContract.parse({ chatProcessId: '' })).toThrow(
        /expected string to have >=1 characters/u,
      );
    });

    it('INVALID: {error: ""} => throws validation error', () => {
      expect(() => commentBatchReplyContract.parse({ error: '' })).toThrow(
        /expected string to have >=1 characters/u,
      );
    });

    it('INVALID: {staleAnchors: [{nodeId only}]} => throws validation error', () => {
      expect(() =>
        commentBatchReplyContract.parse({ staleAnchors: [{ nodeId: 'start' }] }),
      ).toThrow(/received undefined/u);
    });
  });
});
