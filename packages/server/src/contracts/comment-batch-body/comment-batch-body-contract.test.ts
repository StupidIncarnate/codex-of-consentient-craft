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

    it('INVALID: {missing comments} => throws validation error', () => {
      expect(() => {
        commentBatchBodyContract.parse({});
      }).toThrow(/Required/u);
    });
  });
});
