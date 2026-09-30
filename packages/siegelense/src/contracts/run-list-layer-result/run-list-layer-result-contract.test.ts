import { RunListLayerResultStub } from './run-list-layer-result.stub';
import { runListLayerResultContract } from './run-list-layer-result-contract';

describe('runListLayerResultContract', () => {
  describe('valid inputs', () => {
    it('VALID: {stub} => parses successfully', () => {
      const stub = RunListLayerResultStub();

      expect(runListLayerResultContract.parse(stub)).toStrictEqual(stub);
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {runCount: wrong type} => throws', () => {
      expect(() =>
        runListLayerResultContract.parse({ ...RunListLayerResultStub(), runCount: 'nope' }),
      ).toThrow(/expected|invalid/iu);
    });
  });
});
