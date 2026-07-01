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
});
