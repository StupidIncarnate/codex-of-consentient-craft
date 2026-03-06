import { testCaseStepContract } from './test-case-step-contract';
import { TestCaseStepStub } from './test-case-step.stub';

describe('testCaseStepContract', () => {
  describe('valid steps', () => {
    it('VALID: {nodeId, nodeLabel, nodeType, transition: null, assertions: []} => parses successfully', () => {
      const step = TestCaseStepStub();

      const result = testCaseStepContract.parse(step);

      expect(result).toStrictEqual({
        nodeId: 'login-page',
        nodeLabel: 'Login Page',
        nodeType: 'state',
        transition: null,
        assertions: [],
      });
    });

    it('VALID: {with transition and assertions} => parses successfully', () => {
      const step = TestCaseStepStub({
        nodeId: 'dashboard',
        nodeLabel: 'Dashboard',
        nodeType: 'state',
        transition: 'success',
        assertions: [{ type: 'ui-state', description: 'shows dashboard' }],
      });

      const result = testCaseStepContract.parse(step);

      expect(result).toStrictEqual({
        nodeId: 'dashboard',
        nodeLabel: 'Dashboard',
        nodeType: 'state',
        transition: 'success',
        assertions: [{ type: 'ui-state', description: 'shows dashboard' }],
      });
    });

    it('VALID: {terminal nodeType} => parses successfully', () => {
      const step = TestCaseStepStub({
        nodeId: 'end-state',
        nodeLabel: 'End',
        nodeType: 'terminal',
        transition: 'done',
      });

      const result = testCaseStepContract.parse(step);

      expect(result).toStrictEqual({
        nodeId: 'end-state',
        nodeLabel: 'End',
        nodeType: 'terminal',
        transition: 'done',
        assertions: [],
      });
    });
  });

  describe('invalid steps', () => {
    it('INVALID_MULTIPLE: {missing fields} => throws validation error', () => {
      expect(() => {
        return testCaseStepContract.parse({});
      }).toThrow(/Required/u);
    });

    it('INVALID_NODE_TYPE: {nodeType: "invalid"} => throws validation error', () => {
      expect(() => {
        return testCaseStepContract.parse({
          nodeId: 'login-page',
          nodeLabel: 'Login Page',
          nodeType: 'invalid',
          transition: null,
          assertions: [],
        });
      }).toThrow(/Invalid enum value/u);
    });
  });
});
