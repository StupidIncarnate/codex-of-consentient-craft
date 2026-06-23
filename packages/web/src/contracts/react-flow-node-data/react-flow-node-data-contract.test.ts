import { reactFlowNodeDataContract } from './react-flow-node-data-contract';
import { ReactFlowNodeDataStub } from './react-flow-node-data.stub';

describe('reactFlowNodeDataContract', () => {
  describe('valid inputs', () => {
    it.each(['state', 'decision', 'action', 'terminal'] as const)(
      'VALID: {nodeType: %s} => parses successfully',
      (nodeType) => {
        const result = ReactFlowNodeDataStub({ nodeType });

        expect(result).toStrictEqual({
          nodeId: 'login-page',
          label: 'Login Page',
          nodeType,
          observableCount: 0,
        });
      },
    );

    it('VALID: returns a valid ReactFlowNodeData object', () => {
      const result = reactFlowNodeDataContract.parse({
        nodeId: 'checkout-page',
        label: 'Checkout Page',
        nodeType: 'state',
        observableCount: 5,
      });

      expect(result).toStrictEqual({
        nodeId: 'checkout-page',
        label: 'Checkout Page',
        nodeType: 'state',
        observableCount: 5,
      });
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {observableCount: -1} => throws for negative observableCount', () => {
      expect(() => ReactFlowNodeDataStub({ observableCount: -1 as never })).toThrow(
        /Number must be greater than or equal to 0/u,
      );
    });

    it('INVALID: {nodeType: bogus} => throws for invalid nodeType', () => {
      expect(() => ReactFlowNodeDataStub({ nodeType: 'bogus' as never })).toThrow(
        /Invalid enum value/u,
      );
    });
  });
});
