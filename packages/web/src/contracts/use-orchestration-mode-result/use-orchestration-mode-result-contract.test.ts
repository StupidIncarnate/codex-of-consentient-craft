import { UseOrchestrationModeResultStub } from './use-orchestration-mode-result.stub';
import { useOrchestrationModeResultContract } from './use-orchestration-mode-result-contract';

describe('useOrchestrationModeResultContract', () => {
  describe('valid inputs', () => {
    it('VALID: {stub} => parses successfully', () => {
      const stub = UseOrchestrationModeResultStub();

      expect(useOrchestrationModeResultContract.parse(stub)).toStrictEqual(stub);
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {mode: wrong type} => throws', () => {
      expect(() =>
        useOrchestrationModeResultContract.parse({
          ...UseOrchestrationModeResultStub(),
          mode: 123,
        }),
      ).toThrow(/expected|invalid/iu);
    });
  });
});
