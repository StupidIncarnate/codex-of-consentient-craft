import { commentBatchResponseContract } from './comment-batch-response-contract';
import { CommentBatchResponseStub } from './comment-batch-response.stub';

describe('commentBatchResponseContract', () => {
  describe('valid bodies', () => {
    it('VALID: {chatProcessId only} => parses the 200 success shape', () => {
      const response = CommentBatchResponseStub({ chatProcessId: 'proc-comment-batch' });

      const result = commentBatchResponseContract.parse(response);

      expect(result).toStrictEqual({ chatProcessId: 'proc-comment-batch' });
    });

    it('VALID: {staleAnchors only} => parses the 409 denial shape', () => {
      const response = commentBatchResponseContract.parse({
        staleAnchors: [{ flowId: 'login-flow', nodeId: 'start' }],
      });

      expect(response).toStrictEqual({
        staleAnchors: [{ flowId: 'login-flow', nodeId: 'start' }],
      });
    });

    it('VALID: {error only} => parses the failure shape', () => {
      const response = commentBatchResponseContract.parse({ error: 'Quest write failed' });

      expect(response).toStrictEqual({ error: 'Quest write failed' });
    });

    it('EMPTY: {} => parses with every field absent', () => {
      const response = commentBatchResponseContract.parse({});

      expect(response).toStrictEqual({});
    });
  });

  describe('invalid bodies', () => {
    it('INVALID: {chatProcessId: ""} => throws validation error', () => {
      expect(() => commentBatchResponseContract.parse({ chatProcessId: '' })).toThrow(
        /String must contain at least 1 character/u,
      );
    });

    it('INVALID: {error: ""} => throws validation error', () => {
      expect(() => commentBatchResponseContract.parse({ error: '' })).toThrow(
        /String must contain at least 1 character/u,
      );
    });

    it('INVALID: {staleAnchors: [{nodeId only}]} => throws validation error', () => {
      expect(() =>
        commentBatchResponseContract.parse({ staleAnchors: [{ nodeId: 'start' }] }),
      ).toThrow(/Required/u);
    });
  });
});
