import { ArchitectureBindingFlowTraceResultStub } from './architecture-binding-flow-trace-result.stub';
import { architectureBindingFlowTraceResultContract } from './architecture-binding-flow-trace-result-contract';

describe('architectureBindingFlowTraceResultContract', () => {
  describe('valid inputs', () => {
    it('VALID: {stub} => parses successfully', () => {
      const stub = ArchitectureBindingFlowTraceResultStub();

      expect(architectureBindingFlowTraceResultContract.parse(stub)).toStrictEqual(stub);
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {httpFlows: wrong type} => throws', () => {
      expect(() =>
        architectureBindingFlowTraceResultContract.parse({
          ...ArchitectureBindingFlowTraceResultStub(),
          httpFlows: 123,
        }),
      ).toThrow(/expected|invalid/iu);
    });
  });
});
