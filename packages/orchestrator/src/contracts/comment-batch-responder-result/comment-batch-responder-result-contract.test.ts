import { CommentBatchResponderResultStub } from './comment-batch-responder-result.stub';
import { commentBatchResponderResultContract } from './comment-batch-responder-result-contract';

describe('commentBatchResponderResultContract', () => {
  describe('valid inputs', () => {
    it('VALID: {stub} => parses successfully', () => {
      const stub = CommentBatchResponderResultStub();

      expect(commentBatchResponderResultContract.parse(stub)).toStrictEqual(stub);
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {comments: wrong type} => throws', () => {
      expect(() =>
        commentBatchResponderResultContract.parse({
          ...CommentBatchResponderResultStub(),
          comments: 123,
        }),
      ).toThrow(/expected|invalid/iu);
    });
  });
});
