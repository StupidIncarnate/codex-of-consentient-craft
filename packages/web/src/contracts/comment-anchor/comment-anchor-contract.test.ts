import { commentAnchorContract } from './comment-anchor-contract';
import { CommentAnchorStub } from './comment-anchor.stub';

describe('commentAnchorContract', () => {
  describe('valid inputs', () => {
    it('VALID: {flowId, nodeId} => parses successfully without observableId', () => {
      const result = commentAnchorContract.parse({
        flowId: 'login-flow',
        nodeId: 'login-page',
      });

      expect(result).toStrictEqual({
        flowId: 'login-flow',
        nodeId: 'login-page',
      });
    });

    it('VALID: {flowId, nodeId, observableId} => parses successfully with observableId', () => {
      const result = CommentAnchorStub({ observableId: 'login-redirects-to-dashboard' });

      expect(result).toStrictEqual({
        flowId: 'login-flow',
        nodeId: 'login-page',
        observableId: 'login-redirects-to-dashboard',
      });
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {flowId: "Bad Flow"} => throws for non-kebab flowId', () => {
      expect(() => CommentAnchorStub({ flowId: 'Bad Flow' as never })).toThrow(/invalid_string/u);
    });

    it('INVALID: {nodeId: "Bad Node"} => throws for non-kebab nodeId', () => {
      expect(() => CommentAnchorStub({ nodeId: 'Bad Node' as never })).toThrow(/invalid_string/u);
    });
  });
});
