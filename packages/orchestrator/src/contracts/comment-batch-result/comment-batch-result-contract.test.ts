import { CommentBatchResultStub } from './comment-batch-result.stub';
import { commentBatchResultContract } from './comment-batch-result-contract';

describe('commentBatchResultContract', () => {
  describe('valid inputs', () => {
    it('VALID: {stub} => parses successfully', () => {
      const stub = CommentBatchResultStub();

      expect(commentBatchResultContract.parse(stub)).toStrictEqual(stub);
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {chatProcessId: wrong type} => throws', () => {
      expect(() =>
        commentBatchResultContract.parse({ ...CommentBatchResultStub(), chatProcessId: 123 }),
      ).toThrow(/expected|invalid/iu);
    });
  });
});
