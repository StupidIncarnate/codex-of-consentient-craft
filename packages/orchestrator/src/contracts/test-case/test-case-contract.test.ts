import { testCaseContract } from './test-case-contract';
import { TestCaseStub } from './test-case.stub';

describe('testCaseContract', () => {
  describe('valid test cases', () => {
    it('VALID: {id, flowId, terminalNodeId, steps: []} => parses successfully', () => {
      const testCase = TestCaseStub();

      const result = testCaseContract.parse(testCase);

      expect(result).toStrictEqual({
        id: 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
        flowId: 'c23bd10b-58cc-4372-a567-0e02b2c3d479',
        terminalNodeId: 'end-state',
        steps: [],
      });
    });

    it('VALID: {with steps} => parses successfully', () => {
      const testCase = TestCaseStub({
        steps: [
          {
            nodeId: 'login-page',
            nodeLabel: 'Login Page',
            nodeType: 'state',
            transition: null,
            assertions: [],
          },
          {
            nodeId: 'end-state',
            nodeLabel: 'End',
            nodeType: 'terminal',
            transition: 'success',
            assertions: [{ type: 'ui-state', description: 'shows success' }],
          },
        ],
      });

      const result = testCaseContract.parse(testCase);

      expect(result).toStrictEqual({
        id: 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
        flowId: 'c23bd10b-58cc-4372-a567-0e02b2c3d479',
        terminalNodeId: 'end-state',
        steps: [
          {
            nodeId: 'login-page',
            nodeLabel: 'Login Page',
            nodeType: 'state',
            transition: null,
            assertions: [],
          },
          {
            nodeId: 'end-state',
            nodeLabel: 'End',
            nodeType: 'terminal',
            transition: 'success',
            assertions: [{ type: 'ui-state', description: 'shows success' }],
          },
        ],
      });
    });
  });

  describe('invalid test cases', () => {
    it('INVALID_ID: {id: "not-a-uuid"} => throws validation error', () => {
      expect(() => {
        return testCaseContract.parse({
          id: 'not-a-uuid',
          flowId: 'c23bd10b-58cc-4372-a567-0e02b2c3d479',
          terminalNodeId: 'end-state',
          steps: [],
        });
      }).toThrow(/Invalid uuid/u);
    });

    it('INVALID_MULTIPLE: {missing fields} => throws validation error', () => {
      expect(() => {
        return testCaseContract.parse({});
      }).toThrow(/Required/u);
    });
  });
});
