import { BarrelNamedReexportsLayerResultStub } from './barrel-named-reexports-layer-result.stub';
import { barrelNamedReexportsLayerResultContract } from './barrel-named-reexports-layer-result-contract';

describe('barrelNamedReexportsLayerResultContract', () => {
  describe('valid inputs', () => {
    it('VALID: {stub} => parses successfully', () => {
      const stub = BarrelNamedReexportsLayerResultStub();

      expect(barrelNamedReexportsLayerResultContract.parse(stub)).toStrictEqual(stub);
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {value: wrong type} => throws', () => {
      expect(() => barrelNamedReexportsLayerResultContract.parse(123)).toThrow(
        /expected|invalid/iu,
      );
    });
  });
});
