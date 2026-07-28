import { CommentBatchFlow } from './comment-batch-flow';

describe('CommentBatchFlow', () => {
  describe('export', () => {
    it('VALID: CommentBatchFlow => exports an async function', () => {
      expect(CommentBatchFlow).toStrictEqual(expect.any(Function));
    });
  });
});
