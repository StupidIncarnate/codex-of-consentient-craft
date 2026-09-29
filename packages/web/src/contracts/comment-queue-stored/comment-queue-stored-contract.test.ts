import { CommentQueueEntryStub } from '../comment-queue-entry/comment-queue-entry.stub';

import { commentQueueStoredContract } from './comment-queue-stored-contract';
import { CommentQueueStoredStub } from './comment-queue-stored.stub';

describe('commentQueueStoredContract', () => {
  describe('valid inputs', () => {
    it('VALID: {default stub} => keeps the entry', () => {
      expect(CommentQueueStoredStub()).toStrictEqual([CommentQueueEntryStub()]);
    });

    it('EMPTY: {[]} => returns an empty array', () => {
      expect(commentQueueStoredContract.parse([])).toStrictEqual([]);
    });

    it('VALID: {one valid entry beside an invalid one} => keeps the valid one and nulls the other', () => {
      const result = commentQueueStoredContract.parse([
        CommentQueueEntryStub({ text: 'first' }),
        { flowId: 'login-flow' },
      ]);

      expect(result).toStrictEqual([CommentQueueEntryStub({ text: 'first' }), null]);
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {an object} => safeParse fails', () => {
      expect(commentQueueStoredContract.safeParse({}).success).toBe(false);
    });
  });
});
