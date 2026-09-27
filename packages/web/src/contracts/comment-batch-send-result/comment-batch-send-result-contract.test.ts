import { commentBatchSendResultContract } from './comment-batch-send-result-contract';
import { CommentBatchSendResultStub } from './comment-batch-send-result.stub';

describe('commentBatchSendResultContract', () => {
  describe('valid results', () => {
    it('VALID: {outcome: sent} => parses with chatProcessId', () => {
      const result = CommentBatchSendResultStub({ chatProcessId: 'proc-comment-batch' });

      expect(result).toStrictEqual({ outcome: 'sent', chatProcessId: 'proc-comment-batch' });
    });

    it('VALID: {outcome: stale} => parses with a non-empty staleAnchors array', () => {
      const result = CommentBatchSendResultStub({
        outcome: 'stale',
        staleAnchors: [{ flowId: 'login-flow', nodeId: 'start' }],
      });

      expect(result).toStrictEqual({
        outcome: 'stale',
        staleAnchors: [{ flowId: 'login-flow', nodeId: 'start' }],
      });
    });

    it('VALID: {outcome: failed} => parses with an error message', () => {
      const result = CommentBatchSendResultStub({ outcome: 'failed', error: 'Quest write failed' });

      expect(result).toStrictEqual({ outcome: 'failed', error: 'Quest write failed' });
    });
  });

  describe('invalid results', () => {
    it('INVALID: {outcome: unknown} => throws validation error', () => {
      expect(() =>
        commentBatchSendResultContract.parse({ outcome: 'unknown', chatProcessId: 'proc-1' }),
      ).toThrow(/Invalid discriminator/u);
    });

    it('INVALID: {outcome: stale, staleAnchors: []} => throws validation error', () => {
      expect(() =>
        commentBatchSendResultContract.parse({ outcome: 'stale', staleAnchors: [] }),
      ).toThrow(/expected array to have >=1 items/u);
    });

    it('INVALID: {outcome: sent, missing chatProcessId} => throws validation error', () => {
      expect(() => commentBatchSendResultContract.parse({ outcome: 'sent' })).toThrow(
        /received undefined/u,
      );
    });

    it('INVALID: {outcome: failed, error: ""} => throws validation error', () => {
      expect(() => commentBatchSendResultContract.parse({ outcome: 'failed', error: '' })).toThrow(
        /expected string to have >=1 characters/u,
      );
    });
  });
});
