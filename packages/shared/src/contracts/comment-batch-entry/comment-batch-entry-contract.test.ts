import { commentBatchEntryContract } from './comment-batch-entry-contract';
import { CommentBatchEntryStub } from './comment-batch-entry.stub';

describe('commentBatchEntryContract', () => {
  describe('valid entries', () => {
    it('VALID: {default stub} => parses a node anchor with no observableId and no createdAt', () => {
      const result = CommentBatchEntryStub();

      expect(result).toStrictEqual({
        flowId: 'login-flow',
        nodeId: 'start',
        text: 'This assertion looks wrong',
      });
    });

    it('VALID: {observableId: login-redirects-to-dashboard} => parses an observable anchor', () => {
      const result = CommentBatchEntryStub({ observableId: 'login-redirects-to-dashboard' });

      expect(result).toStrictEqual({
        flowId: 'login-flow',
        nodeId: 'start',
        observableId: 'login-redirects-to-dashboard',
        text: 'This assertion looks wrong',
      });
    });

    it('VALID: {createdAt: iso timestamp} => carries the browser-authored createdAt through', () => {
      const result = CommentBatchEntryStub({ createdAt: '2024-01-15T10:00:00.000Z' });

      expect(result).toStrictEqual({
        flowId: 'login-flow',
        nodeId: 'start',
        text: 'This assertion looks wrong',
        createdAt: '2024-01-15T10:00:00.000Z',
      });
    });
  });

  describe('invalid entries', () => {
    it('INVALID: {flowId: "Login Flow"} => throws validation error', () => {
      expect(() => {
        return commentBatchEntryContract.parse({
          flowId: 'Login Flow',
          nodeId: 'start',
          text: 'This assertion looks wrong',
        });
      }).toThrow(/invalid_string/u);
    });

    it('INVALID: {nodeId: "Start Node"} => throws validation error', () => {
      expect(() => {
        return commentBatchEntryContract.parse({
          flowId: 'login-flow',
          nodeId: 'Start Node',
          text: 'This assertion looks wrong',
        });
      }).toThrow(/invalid_string/u);
    });

    it('INVALID: {observableId: "Login Redirects"} => throws validation error', () => {
      expect(() => {
        return commentBatchEntryContract.parse({
          flowId: 'login-flow',
          nodeId: 'start',
          observableId: 'Login Redirects',
          text: 'This assertion looks wrong',
        });
      }).toThrow(/invalid_string/u);
    });

    it('EMPTY: {text: ""} => throws validation error', () => {
      expect(() => {
        return commentBatchEntryContract.parse({
          flowId: 'login-flow',
          nodeId: 'start',
          text: '',
        });
      }).toThrow(/String must contain at least 1 character/u);
    });

    it('INVALID: {createdAt: "not-a-date"} => throws validation error', () => {
      expect(() => {
        return commentBatchEntryContract.parse({
          flowId: 'login-flow',
          nodeId: 'start',
          text: 'This assertion looks wrong',
          createdAt: 'not-a-date',
        });
      }).toThrow(/Invalid datetime/u);
    });

    it('INVALID: {missing nodeId} => throws validation error', () => {
      expect(() => {
        return commentBatchEntryContract.parse({
          flowId: 'login-flow',
          text: 'This assertion looks wrong',
        });
      }).toThrow(/Required/u);
    });
  });
});
