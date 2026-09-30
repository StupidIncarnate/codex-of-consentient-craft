import { CollectInputsLayerResultStub } from './collect-inputs-layer-result.stub';
import { collectInputsLayerResultContract } from './collect-inputs-layer-result-contract';

describe('collectInputsLayerResultContract', () => {
  describe('valid inputs', () => {
    it('VALID: {stub} => parses successfully', () => {
      const stub = CollectInputsLayerResultStub();

      expect(collectInputsLayerResultContract.parse(stub)).toStrictEqual(stub);
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {repoRoot: wrong type} => throws', () => {
      expect(() =>
        collectInputsLayerResultContract.parse({
          ...CollectInputsLayerResultStub(),
          repoRoot: 123,
        }),
      ).toThrow(/expected|invalid/iu);
    });
  });
});
