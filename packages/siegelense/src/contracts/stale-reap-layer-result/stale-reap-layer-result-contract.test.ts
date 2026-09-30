import { StaleReapLayerResultStub } from './stale-reap-layer-result.stub';
import { staleReapLayerResultContract } from './stale-reap-layer-result-contract';

describe('staleReapLayerResultContract', () => {
  describe('valid inputs', () => {
    it('VALID: {stub} => parses successfully', () => {
      const stub = StaleReapLayerResultStub();

      expect(staleReapLayerResultContract.parse(stub)).toStrictEqual(stub);
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {reaped: wrong type} => throws', () => {
      expect(() =>
        staleReapLayerResultContract.parse({ ...StaleReapLayerResultStub(), reaped: 123 }),
      ).toThrow(/expected|invalid/iu);
    });
  });
});
