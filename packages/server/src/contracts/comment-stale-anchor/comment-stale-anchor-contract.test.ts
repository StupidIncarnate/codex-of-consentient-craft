import { commentStaleAnchorContract } from './comment-stale-anchor-contract';
import { CommentStaleAnchorStub } from './comment-stale-anchor.stub';

describe('commentStaleAnchorContract', () => {
  describe('valid anchors', () => {
    it('VALID: {default stub} => parses a node anchor with no observableId', () => {
      const result = CommentStaleAnchorStub();

      expect(result).toStrictEqual({
        flowId: 'login-flow',
        nodeId: 'start',
      });
    });

    it('VALID: {observableId: login-redirects-to-dashboard} => parses an observable anchor', () => {
      const result = CommentStaleAnchorStub({ observableId: 'login-redirects-to-dashboard' });

      expect(result).toStrictEqual({
        flowId: 'login-flow',
        nodeId: 'start',
        observableId: 'login-redirects-to-dashboard',
      });
    });
  });

  describe('invalid anchors', () => {
    it('INVALID: {flowId: "Login Flow"} => throws validation error', () => {
      expect(() => {
        commentStaleAnchorContract.parse({ flowId: 'Login Flow', nodeId: 'start' });
      }).toThrow(/invalid_string/u);
    });

    it('INVALID: {nodeId: "Start Node"} => throws validation error', () => {
      expect(() => {
        commentStaleAnchorContract.parse({ flowId: 'login-flow', nodeId: 'Start Node' });
      }).toThrow(/invalid_string/u);
    });

    it('INVALID: {observableId: "Login Redirects"} => throws validation error', () => {
      expect(() => {
        commentStaleAnchorContract.parse({
          flowId: 'login-flow',
          nodeId: 'start',
          observableId: 'Login Redirects',
        });
      }).toThrow(/invalid_string/u);
    });

    it('INVALID: {missing nodeId} => throws validation error', () => {
      expect(() => {
        commentStaleAnchorContract.parse({ flowId: 'login-flow' });
      }).toThrow(/Required/u);
    });
  });
});
