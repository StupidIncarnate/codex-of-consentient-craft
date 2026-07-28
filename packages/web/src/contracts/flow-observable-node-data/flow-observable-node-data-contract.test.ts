import { flowObservableNodeDataContract } from './flow-observable-node-data-contract';
import { FlowObservableNodeDataStub } from './flow-observable-node-data.stub';

describe('flowObservableNodeDataContract', () => {
  describe('valid inputs', () => {
    it.each(['ui-state', 'api-call', 'db-query', 'custom'] as const)(
      'VALID: {outcomeType: %s} => parses successfully',
      (outcomeType) => {
        const result = FlowObservableNodeDataStub({ outcomeType });

        expect(result).toStrictEqual({
          observableId: 'login-redirects-to-dashboard',
          outcomeType,
          description: 'redirects to dashboard',
        });
      },
    );

    it('VALID: returns a valid FlowObservableNodeData object', () => {
      const result = flowObservableNodeDataContract.parse({
        observableId: 'shows-error-banner',
        outcomeType: 'ui-state',
        description: 'shows an error banner when credentials are invalid',
      });

      expect(result).toStrictEqual({
        observableId: 'shows-error-banner',
        outcomeType: 'ui-state',
        description: 'shows an error banner when credentials are invalid',
      });
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {observableId: "Bad Id"} => throws for non-kebab observableId', () => {
      expect(() => FlowObservableNodeDataStub({ observableId: 'Bad Id' as never })).toThrow(
        /Invalid/u,
      );
    });

    it('INVALID: {outcomeType: bogus} => throws for invalid outcomeType', () => {
      expect(() => FlowObservableNodeDataStub({ outcomeType: 'bogus' as never })).toThrow(
        /Invalid enum value/u,
      );
    });
  });

  describe('comment anchor fields', () => {
    it('VALID: {no nodeId, questId, or flowId} => parses successfully without anchor fields', () => {
      const result = flowObservableNodeDataContract.parse({
        observableId: 'login-redirects-to-dashboard',
        outcomeType: 'ui-state',
        description: 'redirects to dashboard',
      });

      expect(result).toStrictEqual({
        observableId: 'login-redirects-to-dashboard',
        outcomeType: 'ui-state',
        description: 'redirects to dashboard',
      });
    });

    it('VALID: {nodeId, questId, flowId} => parses successfully with anchor fields', () => {
      const result = FlowObservableNodeDataStub({
        nodeId: 'login-page',
        questId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        flowId: 'login-flow',
      });

      expect(result).toStrictEqual({
        observableId: 'login-redirects-to-dashboard',
        outcomeType: 'ui-state',
        description: 'redirects to dashboard',
        nodeId: 'login-page',
        questId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        flowId: 'login-flow',
      });
    });

    it('INVALID: {questId: ""} => throws for empty questId', () => {
      expect(() => FlowObservableNodeDataStub({ questId: '' as never })).toThrow(
        /String must contain at least 1 character/u,
      );
    });

    it('INVALID: {flowId: "Bad Flow"} => throws for non-kebab-case flowId', () => {
      expect(() => FlowObservableNodeDataStub({ flowId: 'Bad Flow' as never })).toThrow(/Invalid/u);
    });

    it('INVALID: {nodeId: "Bad Node"} => throws for non-kebab-case nodeId', () => {
      expect(() => FlowObservableNodeDataStub({ nodeId: 'Bad Node' as never })).toThrow(/Invalid/u);
    });
  });
});
