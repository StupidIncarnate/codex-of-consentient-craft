import { CommentAnchorStub } from '../../contracts/comment-anchor/comment-anchor.stub';

import { isSameCommentAnchorGuard } from './is-same-comment-anchor-guard';

describe('isSameCommentAnchorGuard', () => {
  describe('empty input', () => {
    it('EMPTY: {left: undefined, right: undefined} => returns false', () => {
      expect(isSameCommentAnchorGuard({})).toBe(false);
    });

    it('EMPTY: {left: undefined} => returns false', () => {
      const right = CommentAnchorStub();

      expect(isSameCommentAnchorGuard({ right })).toBe(false);
    });

    it('EMPTY: {right: undefined} => returns false', () => {
      const left = CommentAnchorStub();

      expect(isSameCommentAnchorGuard({ left })).toBe(false);
    });
  });

  describe('matching anchors', () => {
    it('VALID: {identical node anchors} => returns true', () => {
      const left = CommentAnchorStub();
      const right = CommentAnchorStub();

      expect(isSameCommentAnchorGuard({ left, right })).toBe(true);
    });

    it('VALID: {identical observable anchors} => returns true', () => {
      const left = CommentAnchorStub({ observableId: 'login-redirects-to-dashboard' });
      const right = CommentAnchorStub({ observableId: 'login-redirects-to-dashboard' });

      expect(isSameCommentAnchorGuard({ left, right })).toBe(true);
    });
  });

  describe('non-matching anchors', () => {
    it('INVALID: {differing flowId} => returns false', () => {
      const left = CommentAnchorStub();
      const right = CommentAnchorStub({ flowId: 'signup-flow' });

      expect(isSameCommentAnchorGuard({ left, right })).toBe(false);
    });

    it('INVALID: {differing nodeId} => returns false', () => {
      const left = CommentAnchorStub();
      const right = CommentAnchorStub({ nodeId: 'signup-page' });

      expect(isSameCommentAnchorGuard({ left, right })).toBe(false);
    });

    it('INVALID: {differing observableId} => returns false', () => {
      const left = CommentAnchorStub({ observableId: 'login-redirects-to-dashboard' });
      const right = CommentAnchorStub({ observableId: 'login-shows-error-banner' });

      expect(isSameCommentAnchorGuard({ left, right })).toBe(false);
    });

    it('INVALID: {left has observableId, right does not} => returns false', () => {
      const left = CommentAnchorStub({ observableId: 'login-redirects-to-dashboard' });
      const right = CommentAnchorStub();

      expect(isSameCommentAnchorGuard({ left, right })).toBe(false);
    });

    it('INVALID: {right has observableId, left does not} => returns false', () => {
      const left = CommentAnchorStub();
      const right = CommentAnchorStub({ observableId: 'login-redirects-to-dashboard' });

      expect(isSameCommentAnchorGuard({ left, right })).toBe(false);
    });
  });
});
