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

    // The anchor ids are the validated surface for a queued comment (a non-kebab flowId/nodeId is
    // already proven at the commentAnchorContract level this contract extends); observableId is the
    // third anchor field and has no dedicated coverage of its own anywhere, so it is proven here.
    it('INVALID: {observableId: "Bad Observable"} => throws for non-kebab observableId', () => {
      expect(() => CommentQueueEntryStub({ observableId: 'Bad Observable' as never })).toThrow(
        /invalid_string/u,
      );
    });
  });

  describe('JSON round trip', () => {
    // The real localStorage write path (comment-queue-state.ts) is JSON.stringify on write and
    // JSON.parse + safeParse on read — never a hand-rolled serializer. This proves that real round
    // trip survives quotes, a backslash and brace characters byte-identical: a string-concatenation
    // serializer would corrupt or truncate at the first quote instead.
    it('VALID: {text with quotes, a backslash and braces} => JSON.stringify then JSON.parse then re-parsed through the contract is byte-identical to the original', () => {
      const entry = CommentQueueEntryStub({
        text: 'She typed "click submit" \\ then pasted {"nodeId": "start", "ok": true} inline',
      });

      const roundTripped: unknown = JSON.parse(JSON.stringify(entry));

      expect(commentQueueEntryContract.parse(roundTripped)).toStrictEqual(entry);
    });
  });
});
