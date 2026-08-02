import { CommentBatchEntryStub } from '@dungeonmaster/shared/contracts';

import { commentBatchBodyContract } from './comment-batch-body-contract';
import { CommentBatchBodyStub } from './comment-batch-body.stub';

describe('commentBatchBodyContract', () => {
  describe('valid bodies', () => {
    it('VALID: {default stub} => parses one comment with no observableId', () => {
      const result = CommentBatchBodyStub();

      expect(result).toStrictEqual({
        comments: [
          {
            flowId: 'login-flow',
            nodeId: 'start',
            text: 'This assertion looks wrong',
          },
        ],
      });
    });

    it('VALID: {comment with observableId} => parses an observable-anchored comment', () => {
      const result = CommentBatchBodyStub({
        comments: [CommentBatchEntryStub({ observableId: 'login-redirects-to-dashboard' })],
      });

      expect(result).toStrictEqual({
        comments: [
          {
            flowId: 'login-flow',
            nodeId: 'start',
            observableId: 'login-redirects-to-dashboard',
            text: 'This assertion looks wrong',
          },
        ],
      });
    });

    it('VALID: {two comments} => parses one array entry per queued comment', () => {
      const result = CommentBatchBodyStub({
        comments: [
          CommentBatchEntryStub({ nodeId: 'start' }),
          CommentBatchEntryStub({ nodeId: 'submit' }),
        ],
      });

      expect(result).toStrictEqual({
        comments: [
          { flowId: 'login-flow', nodeId: 'start', text: 'This assertion looks wrong' },
          { flowId: 'login-flow', nodeId: 'submit', text: 'This assertion looks wrong' },
        ],
      });
    });
  });

  describe('invalid bodies', () => {
    it('EMPTY: {comments: []} => throws validation error', () => {
      expect(() => {
        commentBatchBodyContract.parse({ comments: [] });
      }).toThrow(/Array must contain at least 1 element/u);
    });

    it('INVALID: {comment with malformed flowId} => throws validation error', () => {
      expect(() => {
        commentBatchBodyContract.parse({
          comments: [{ flowId: 'Login Flow', nodeId: 'start', text: 'x' }],
        });
      }).toThrow(/invalid_string/u);
    });

    // check-malformed-entry-400 names a bad flowId as its example; nodeId and observableId are the
    // other two branded anchor ids on the same entry and carry no coverage of their own at this
    // composed-body layer (only flowId's rejection is proven here; nodeId/observableId are proven
    // individually on commentBatchEntryContract's own test, but never through THIS sink).
    it('INVALID: {comment with malformed nodeId} => throws validation error', () => {
      expect(() => {
        commentBatchBodyContract.parse({
          comments: [{ flowId: 'login-flow', nodeId: 'Start Node', text: 'x' }],
        });
      }).toThrow(/invalid_string/u);
    });

    it('INVALID: {comment with malformed observableId} => throws validation error', () => {
      expect(() => {
        commentBatchBodyContract.parse({
          comments: [
            { flowId: 'login-flow', nodeId: 'start', observableId: 'Login Redirects', text: 'x' },
          ],
        });
      }).toThrow(/invalid_string/u);
    });

    // A queue corrupted by hand (or by a future bug) is more likely to carry ONE bad entry among
    // otherwise-good ones than an all-bad batch — z.array validates every element, so this proves
    // the whole batch is rejected rather than the bad entry being silently dropped and the good one
    // persisted.
    it('INVALID: {one malformed entry among two otherwise-valid entries} => rejects the whole batch rather than silently dropping the bad entry', () => {
      expect(() => {
        commentBatchBodyContract.parse({
          comments: [
            { flowId: 'login-flow', nodeId: 'start', text: 'valid one' },
            { flowId: 'Login Flow', nodeId: 'submit', text: 'malformed flowId' },
          ],
        });
      }).toThrow(/invalid_string/u);
    });

    it('INVALID: {missing comments} => throws validation error', () => {
      expect(() => {
        commentBatchBodyContract.parse({});
      }).toThrow(/Required/u);
    });

    // The compose editor already refuses to queue whitespace-only text client-side (Enter on blank
    // text leaves the editor open and writes nothing) — but that guard lives in the popover widget,
    // not in commentTextContract, which only checks non-empty length. A non-browser client reaching
    // this route directly could otherwise persist an invisible comment nobody meant to leave; the
    // refine on this composed body is the one sink every caller of this route is forced through.
    it('INVALID: {comment text: whitespace-only} => throws validation error', () => {
      expect(() => {
        commentBatchBodyContract.parse({
          comments: [{ flowId: 'login-flow', nodeId: 'start', text: '   ' }],
        });
      }).toThrow(/whitespace-only/u);
    });
  });

  describe('hostile but structurally valid bodies', () => {
    it('VALID: {two identical entries in the same batch} => both parse; the schema does not deduplicate by content', () => {
      const result = commentBatchBodyContract.parse({
        comments: [
          { flowId: 'login-flow', nodeId: 'start', text: 'duplicate note' },
          { flowId: 'login-flow', nodeId: 'start', text: 'duplicate note' },
        ],
      });

      expect(result).toStrictEqual({
        comments: [
          { flowId: 'login-flow', nodeId: 'start', text: 'duplicate note' },
          { flowId: 'login-flow', nodeId: 'start', text: 'duplicate note' },
        ],
      });
    });

    // commentTextContract places no upper bound on length, so a comment far longer than any UI
    // element here was sized for still parses whole — this documents that the absence of a cap is
    // deliberate acceptance at this sink, not an oversight that silently truncates or crashes.
    it('VALID: {comment text far longer than any UI here was designed for} => the schema places no upper bound and accepts it whole', () => {
      const oversized = 'x'.repeat(10_000);

      const result = commentBatchBodyContract.parse({
        comments: [{ flowId: 'login-flow', nodeId: 'start', text: oversized }],
      });

      expect(result).toStrictEqual({
        comments: [{ flowId: 'login-flow', nodeId: 'start', text: oversized }],
      });
    });
  });
});
