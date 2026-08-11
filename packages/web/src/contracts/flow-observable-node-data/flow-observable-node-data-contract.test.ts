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
          package: { name: 'auth-service', packageType: 'library' },
          commentCount: 0,
          nodeId: 'login-page',
        });
      },
    );

    it('VALID: returns a valid FlowObservableNodeData object', () => {
      const result = flowObservableNodeDataContract.parse({
        observableId: 'shows-error-banner',
        outcomeType: 'ui-state',
        description: 'shows an error banner when credentials are invalid',
        package: { name: 'auth-service', packageType: 'library' },
        commentCount: 3,
        nodeId: 'login-page',
      });

      expect(result).toStrictEqual({
        observableId: 'shows-error-banner',
        outcomeType: 'ui-state',
        description: 'shows an error banner when credentials are invalid',
        package: { name: 'auth-service', packageType: 'library' },
        commentCount: 3,
        nodeId: 'login-page',
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

    it('INVALID: {commentCount: -1} => throws for negative commentCount', () => {
      expect(() => FlowObservableNodeDataStub({ commentCount: -1 as never })).toThrow(
        /Number must be greater than or equal to 0/u,
      );
    });

    it('EMPTY: {no nodeId} => throws for missing required nodeId', () => {
      expect(() =>
        flowObservableNodeDataContract.parse({
          observableId: 'login-redirects-to-dashboard',
          outcomeType: 'ui-state',
          description: 'redirects to dashboard',
          package: { name: 'auth-service', packageType: 'library' },
          commentCount: 0,
        }),
      ).toThrow(/Required/u);
    });

    it('EMPTY: {no package} => throws, so no assertion card can render without naming its side', () => {
      expect(() =>
        flowObservableNodeDataContract.parse({
          observableId: 'login-redirects-to-dashboard',
          outcomeType: 'ui-state',
          description: 'redirects to dashboard',
          commentCount: 0,
          nodeId: 'login-page',
        }),
      ).toThrow(/Required/u);
    });
  });

  describe('comment anchor fields', () => {
    it('VALID: {no questId or flowId} => parses successfully without compose anchor fields', () => {
      const result = flowObservableNodeDataContract.parse({
        observableId: 'login-redirects-to-dashboard',
        outcomeType: 'ui-state',
        description: 'redirects to dashboard',
        package: { name: 'auth-service', packageType: 'library' },
        commentCount: 0,
        nodeId: 'login-page',
      });

      expect(result).toStrictEqual({
        observableId: 'login-redirects-to-dashboard',
        outcomeType: 'ui-state',
        description: 'redirects to dashboard',
        package: { name: 'auth-service', packageType: 'library' },
        commentCount: 0,
        nodeId: 'login-page',
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
        package: { name: 'auth-service', packageType: 'library' },
        commentCount: 0,
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
