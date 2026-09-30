import { PopulateOneRootLayerResultStub } from './populate-one-root-layer-result.stub';
import { populateOneRootLayerResultContract } from './populate-one-root-layer-result-contract';

describe('populateOneRootLayerResultContract', () => {
  describe('valid inputs', () => {
    it('VALID: {stub} => parses successfully', () => {
      const stub = PopulateOneRootLayerResultStub();

      expect(populateOneRootLayerResultContract.parse(stub)).toStrictEqual(stub);
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {workspacePackageRoots: wrong type} => throws', () => {
      expect(() =>
        populateOneRootLayerResultContract.parse({
          ...PopulateOneRootLayerResultStub(),
          workspacePackageRoots: 123,
        }),
      ).toThrow(/expected|invalid/iu);
    });
  });
});
