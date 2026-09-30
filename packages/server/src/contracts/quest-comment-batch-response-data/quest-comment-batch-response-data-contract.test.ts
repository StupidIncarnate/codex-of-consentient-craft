import { questCommentBatchResponseDataContract } from './quest-comment-batch-response-data-contract';
import { QuestCommentBatchResponseDataStub } from './quest-comment-batch-response-data.stub';
import { CommentStaleAnchorStub } from '../comment-stale-anchor/comment-stale-anchor.stub';

describe('questCommentBatchResponseDataContract', () => {
  it('VALID: {default stub} => parses the delivered batch', () => {
    const result = QuestCommentBatchResponseDataStub();

    expect(questCommentBatchResponseDataContract.parse(result)).toStrictEqual({
      chatProcessId: 'proc-12345',
      deliveredMessage: 'User Comment: This copy is wrong',
    });
  });

  it('VALID: {error + staleAnchors} => parses the stale-anchor refusal', () => {
    expect(
      questCommentBatchResponseDataContract.parse({
        error: 'Comments reference anchors that no longer exist',
        staleAnchors: [CommentStaleAnchorStub()],
      }),
    ).toStrictEqual({
      error: 'Comments reference anchors that no longer exist',
      staleAnchors: [CommentStaleAnchorStub()],
    });
  });

  it('INVALID: {neither shape} => throws validation error', () => {
    expect(() => questCommentBatchResponseDataContract.parse({})).toThrow(/Invalid input/u);
  });
});
