import { questCommentContract } from './quest-comment-contract';
import { QuestCommentStub } from './quest-comment.stub';

describe('questCommentContract', () => {
  describe('valid comments', () => {
    it('VALID: {default stub} => parses successfully without observableId', () => {
      const result = QuestCommentStub();

      expect(result).toStrictEqual({
        id: 'c0e3e17a-58cc-4372-a567-0e02b2c3d479',
        flowId: 'login-flow',
        nodeId: 'start',
        text: 'This assertion looks wrong',
        createdAt: '2024-01-15T10:00:00.000Z',
      });
    });

    it('VALID: {observableId: login-redirects-to-dashboard} => parses successfully with observableId', () => {
      const result = QuestCommentStub({
        observableId: 'login-redirects-to-dashboard',
      });

      expect(result).toStrictEqual({
        id: 'c0e3e17a-58cc-4372-a567-0e02b2c3d479',
        flowId: 'login-flow',
        nodeId: 'start',
        observableId: 'login-redirects-to-dashboard',
        text: 'This assertion looks wrong',
        createdAt: '2024-01-15T10:00:00.000Z',
      });
    });
  });

  describe('invalid comments', () => {
    it('INVALID: {id: "not-a-uuid"} => throws validation error', () => {
      expect(() => {
        return questCommentContract.parse({
          id: 'not-a-uuid',
          flowId: 'login-flow',
          nodeId: 'start',
          text: 'This assertion looks wrong',
          createdAt: '2024-01-15T10:00:00.000Z',
        });
      }).toThrow(/Invalid uuid/u);
    });

    it('INVALID: {flowId: "Login Flow"} => throws validation error', () => {
      expect(() => {
        return questCommentContract.parse({
          id: 'c0e3e17a-58cc-4372-a567-0e02b2c3d479',
          flowId: 'Login Flow',
          nodeId: 'start',
          text: 'This assertion looks wrong',
          createdAt: '2024-01-15T10:00:00.000Z',
        });
      }).toThrow(/invalid_string/u);
    });

    it('INVALID: {nodeId: "Start Node"} => throws validation error', () => {
      expect(() => {
        return questCommentContract.parse({
          id: 'c0e3e17a-58cc-4372-a567-0e02b2c3d479',
          flowId: 'login-flow',
          nodeId: 'Start Node',
          text: 'This assertion looks wrong',
          createdAt: '2024-01-15T10:00:00.000Z',
        });
      }).toThrow(/invalid_string/u);
    });

    it('INVALID: {observableId: "Login Redirects"} => throws validation error', () => {
      expect(() => {
        return questCommentContract.parse({
          id: 'c0e3e17a-58cc-4372-a567-0e02b2c3d479',
          flowId: 'login-flow',
          nodeId: 'start',
          observableId: 'Login Redirects',
          text: 'This assertion looks wrong',
          createdAt: '2024-01-15T10:00:00.000Z',
        });
      }).toThrow(/invalid_string/u);
    });

    it('INVALID: {text: ""} => throws validation error', () => {
      expect(() => {
        return questCommentContract.parse({
          id: 'c0e3e17a-58cc-4372-a567-0e02b2c3d479',
          flowId: 'login-flow',
          nodeId: 'start',
          text: '',
          createdAt: '2024-01-15T10:00:00.000Z',
        });
      }).toThrow(/String must contain at least 1 character/u);
    });

    it('INVALID: {createdAt: "not-a-date"} => throws validation error', () => {
      expect(() => {
        return questCommentContract.parse({
          id: 'c0e3e17a-58cc-4372-a567-0e02b2c3d479',
          flowId: 'login-flow',
          nodeId: 'start',
          text: 'This assertion looks wrong',
          createdAt: 'not-a-date',
        });
      }).toThrow(/Invalid datetime/u);
    });

    it('INVALID: {missing nodeId} => throws validation error', () => {
      expect(() => {
        return questCommentContract.parse({
          id: 'c0e3e17a-58cc-4372-a567-0e02b2c3d479',
          flowId: 'login-flow',
          text: 'This assertion looks wrong',
          createdAt: '2024-01-15T10:00:00.000Z',
        });
      }).toThrow(/Required/u);
    });
  });
});
