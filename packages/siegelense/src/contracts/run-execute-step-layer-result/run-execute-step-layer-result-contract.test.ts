import { RunExecuteStepLayerResultStub } from './run-execute-step-layer-result.stub';
import { runExecuteStepLayerResultContract } from './run-execute-step-layer-result-contract';

describe('runExecuteStepLayerResultContract', () => {
  describe('valid inputs', () => {
    it('VALID: {stub} => parses successfully', () => {
      const stub = RunExecuteStepLayerResultStub();

      expect(runExecuteStepLayerResultContract.parse(stub)).toStrictEqual(stub);
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {reading: wrong type} => throws', () => {
      expect(() =>
        runExecuteStepLayerResultContract.parse({
          ...RunExecuteStepLayerResultStub(),
          reading: 123,
        }),
      ).toThrow(/expected|invalid/iu);
    });
  });
});
