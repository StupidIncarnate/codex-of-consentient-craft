import { ResolvePackageGroupsLayerResultStub } from './resolve-package-groups-layer-result.stub';
import { resolvePackageGroupsLayerResultContract } from './resolve-package-groups-layer-result-contract';

describe('resolvePackageGroupsLayerResultContract', () => {
  describe('valid inputs', () => {
    it('VALID: {stub} => parses successfully', () => {
      const stub = ResolvePackageGroupsLayerResultStub();

      expect(resolvePackageGroupsLayerResultContract.parse(stub)).toStrictEqual(stub);
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {httpBackendRoots: wrong type} => throws', () => {
      expect(() =>
        resolvePackageGroupsLayerResultContract.parse({
          ...ResolvePackageGroupsLayerResultStub(),
          httpBackendRoots: 123,
        }),
      ).toThrow(/expected|invalid/iu);
    });
  });
});
