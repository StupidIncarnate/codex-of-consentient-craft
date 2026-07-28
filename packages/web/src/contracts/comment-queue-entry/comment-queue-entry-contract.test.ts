import { commentQueueEntryContract } from './comment-queue-entry-contract';
import { CommentQueueEntryStub } from './comment-queue-entry.stub';

describe('commentQueueEntryContract', () => {
  describe('valid inputs', () => {
    it('VALID: {flowId, nodeId, text, createdAt} => parses successfully without observableId', () => {
      const result = commentQueueEntryContract.parse({
        flowId: 'login-flow',
        nodeId: 'login-page',
        text: 'This assertion looks wrong',
        createdAt: '2026-07-01T12:00:00.000Z',
      });

      expect(result).toStrictEqual({
        flowId: 'login-flow',
        nodeId: 'login-page',
        text: 'This assertion looks wrong',
        createdAt: '2026-07-01T12:00:00.000Z',
      });
    });

    it('VALID: {observableId set} => parses successfully with observableId', () => {
      const result = CommentQueueEntryStub({ observableId: 'login-redirects-to-dashboard' });

      expect(result).toStrictEqual({
        flowId: 'login-flow',
        nodeId: 'login-page',
        observableId: 'login-redirects-to-dashboard',
        text: 'This assertion looks wrong',
        createdAt: '2026-07-01T12:00:00.000Z',
      });
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {text: ""} => throws for empty text', () => {
      expect(() => CommentQueueEntryStub({ text: '' as never })).toThrow(
        /String must contain at least 1 character/u,
      );
    });

    it('INVALID: {createdAt: "not-a-date"} => throws for non-ISO createdAt', () => {
      expect(() => CommentQueueEntryStub({ createdAt: 'not-a-date' as never })).toThrow(
        /Invalid datetime/u,
      );
    });
  });
});
