import { RunMissingCheckLayerResultStub } from './run-missing-check-layer-result.stub';
import { runMissingCheckLayerResultContract } from './run-missing-check-layer-result-contract';

describe('runMissingCheckLayerResultContract', () => {
  describe('valid inputs', () => {
    it('VALID: {stub} => parses successfully', () => {
      const stub = RunMissingCheckLayerResultStub();

      expect(runMissingCheckLayerResultContract.parse(stub)).toStrictEqual(stub);
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {storedReturnContent: wrong type} => throws', () => {
      expect(() =>
        runMissingCheckLayerResultContract.parse({
          ...RunMissingCheckLayerResultStub(),
          storedReturnContent: 123,
        }),
      ).toThrow(/expected|invalid/iu);
    });
  });
});
