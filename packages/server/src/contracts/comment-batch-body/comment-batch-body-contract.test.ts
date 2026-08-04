import type { ZodError } from 'zod';
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

    // The delivered batch becomes the `-p` argv of a spawned process, and an argv string cannot
    // carry a NUL. Rejecting it HERE, at the same sink as the whitespace guard, is what keeps the
    // failure a clean 400 with nothing written. Validated any later it is a 500 raised by spawn()
    // AFTER the comment was already persisted — and because the browser releases its queue only on
    // a 200, every retry appends another duplicate row and the send can never succeed.
    it('INVALID: {comment text carrying a NUL byte} => throws validation error', () => {
      expect(() => {
        commentBatchBodyContract.parse({
          comments: [{ flowId: 'login-flow', nodeId: 'start', text: 'nul\u0000byte' }],
        });
      }).toThrow(/control character/u);
    });

    it('INVALID: {one NUL-carrying entry among two otherwise-valid entries} => rejects the whole batch', () => {
      expect(() => {
        commentBatchBodyContract.parse({
          comments: [
            { flowId: 'login-flow', nodeId: 'start', text: 'valid one' },
            { flowId: 'login-flow', nodeId: 'submit', text: 'bad\u0000entry' },
          ],
        });
      }).toThrow(/control character/u);
    });
  });

  describe('issue path — entry-level vs array-level classification', () => {
    // The responder (quest-comment-batch-responder) tells "array is empty/absent" apart from "one
    // bad entry" ONLY by issue.path: length 1 with path[0] === 'comments' means array-level, a
    // longer path means entry-level. Both refines on nonWhitespaceCommentBatchEntryContract sit on
    // the ENTRY schema specifically so a rejected entry's path stays ['comments', index, ...] and
    // never collapses to ['comments'] — which would flip the responder's message to the empty-batch
    // one on a batch that was never empty. A bare `.toThrow()` on the message text cannot see this:
    // the refine's own message is identical no matter which schema level it is attached to.
    it('INVALID: {whitespace-only text in the only entry} => issue path is entry-scoped, not array-scoped', () => {
      const result = commentBatchBodyContract.safeParse({
        comments: [{ flowId: 'login-flow', nodeId: 'start', text: '   ' }],
      });
      const { error } = result as { success: false; error: ZodError };
      const [issue] = error.issues;

      expect(result.success).toBe(false);
      expect(issue?.path).toStrictEqual(['comments', 0]);
    });

    it('INVALID: {NUL byte in the only entry} => issue path is entry-scoped, not array-scoped', () => {
      const result = commentBatchBodyContract.safeParse({
        comments: [{ flowId: 'login-flow', nodeId: 'start', text: 'nul\u0000byte' }],
      });
      const { error } = result as { success: false; error: ZodError };
      const [issue] = error.issues;

      expect(result.success).toBe(false);
      expect(issue?.path).toStrictEqual(['comments', 0]);
    });

    // The other half of the classification: an empty batch IS array-scoped by design (min(1) sits
    // on the array itself, not on any entry) — this pins the branch the entry-level tests above are
    // contrasted against.
    it('EMPTY: {comments: []} => issue path is array-scoped, exactly ["comments"]', () => {
      const result = commentBatchBodyContract.safeParse({ comments: [] });
      const { error } = result as { success: false; error: ZodError };
      const [issue] = error.issues;

      expect(result.success).toBe(false);
      expect(issue?.path).toStrictEqual(['comments']);
    });

    // The malformed entry sits at index 1, not index 0 — a fixture is only discriminating if the
    // assertion actually reads the index, rather than just confirming something threw.
    it('INVALID: {malformed flowId is the SECOND of two entries} => issue path names index 1, not index 0', () => {
      const result = commentBatchBodyContract.safeParse({
        comments: [
          { flowId: 'login-flow', nodeId: 'start', text: 'valid one' },
          { flowId: 'Login Flow', nodeId: 'submit', text: 'malformed flowId' },
        ],
      });
      const { error } = result as { success: false; error: ZodError };
      const [issue] = error.issues;

      expect(result.success).toBe(false);
      expect(issue?.path).toStrictEqual(['comments', 1, 'flowId']);
    });

    it('INVALID: {NUL-carrying entry is the SECOND of two entries} => issue path names index 1, not index 0', () => {
      const result = commentBatchBodyContract.safeParse({
        comments: [
          { flowId: 'login-flow', nodeId: 'start', text: 'valid one' },
          { flowId: 'login-flow', nodeId: 'submit', text: 'bad\u0000entry' },
        ],
      });
      const { error } = result as { success: false; error: ZodError };
      const [issue] = error.issues;

      expect(result.success).toBe(false);
      expect(issue?.path).toStrictEqual(['comments', 1]);
    });
  });

  describe('control characters the compose editor legitimately produces', () => {
    // Shift+Enter inserts a newline, and pasted text can carry tabs and CRLF. None of them break an
    // argv, so the guard must let every one through — a blanket control-character ban here would
    // reject the ordinary multi-line comment the popover exists to write.
    it('VALID: {comment text carrying newlines, tabs and a carriage return} => parses unchanged', () => {
      const multiline = 'first line\nsecond\tindented\r\nthird line';

      const result = commentBatchBodyContract.parse({
        comments: [{ flowId: 'login-flow', nodeId: 'start', text: multiline }],
      });

      expect(result).toStrictEqual({
        comments: [{ flowId: 'login-flow', nodeId: 'start', text: multiline }],
      });
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
