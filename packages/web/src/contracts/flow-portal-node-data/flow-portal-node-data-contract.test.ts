import { flowPortalNodeDataContract } from './flow-portal-node-data-contract';
import { FlowPortalNodeDataStub } from './flow-portal-node-data.stub';

describe('flowPortalNodeDataContract', () => {
  describe('valid inputs', () => {
    it('VALID: {cross-flow reference + label} => parses successfully', () => {
      const result = flowPortalNodeDataContract.parse({
        reference: 'compile-flow:compile-entry',
        label: '↗ compile-flow → compile-entry',
      });

      expect(result).toStrictEqual({
        reference: 'compile-flow:compile-entry',
        label: '↗ compile-flow → compile-entry',
      });
    });

    it('VALID: stub default => returns the compile-flow portal descriptor', () => {
      const result = FlowPortalNodeDataStub();

      expect(result).toStrictEqual({
        reference: 'compile-flow:compile-entry',
        label: '↗ compile-flow → compile-entry',
      });
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {reference: ""} => throws for empty cross-flow reference', () => {
      expect(() => FlowPortalNodeDataStub({ reference: '' as never })).toThrow(
        /too_small|at least/u,
      );
    });

    it('INVALID: {label: ""} => throws for empty label', () => {
      expect(() => FlowPortalNodeDataStub({ label: '' as never })).toThrow(/too_small|at least/u);
    });
  });
});
