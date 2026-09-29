import { OwnerIndexOwnerStub } from '../../contracts/owner-index-owner/owner-index-owner.stub';
import { OwnerIndexPackageStub } from '../../contracts/owner-index-package/owner-index-package.stub';
import { OwnerIndexStub } from '../../contracts/owner-index/owner-index.stub';
import { PackageNameStub } from '../../contracts/package-name/package-name.stub';
import { ownerIndexOwnersReachableTransformer } from './owner-index-owners-reachable-transformer';

const alpha = PackageNameStub({ value: '@repo/alpha' });
const shared = PackageNameStub({ value: '@repo/shared' });
const stranger = PackageNameStub({ value: '@repo/stranger' });

describe('ownerIndexOwnersReachableTransformer', () => {
  describe('valid input', () => {
    it('VALID: {alpha depends on shared} => own owners first, then shared, never the stranger', () => {
      const ownerIndex = OwnerIndexStub({
        owners: [
          OwnerIndexOwnerStub({
            ownerName: 'Quest',
            contractName: 'questContract',
            packageName: shared,
          }),
          OwnerIndexOwnerStub({
            ownerName: 'Secret',
            contractName: 'secretContract',
            packageName: stranger,
          }),
          OwnerIndexOwnerStub({
            ownerName: 'AlphaThing',
            contractName: 'alphaThingContract',
            packageName: alpha,
          }),
        ],
        packages: [
          OwnerIndexPackageStub({ name: alpha, dependencies: [shared] }),
          OwnerIndexPackageStub({ name: shared }),
          OwnerIndexPackageStub({ name: stranger }),
        ],
      });

      const result = ownerIndexOwnersReachableTransformer({ ownerIndex, packageName: alpha });

      expect(result.map((owner) => owner.contractName)).toStrictEqual([
        'alphaThingContract',
        'questContract',
      ]);
    });

    it('VALID: {shared depends on nothing} => sees only its own owners', () => {
      const ownerIndex = OwnerIndexStub({
        owners: [
          OwnerIndexOwnerStub({
            ownerName: 'Quest',
            contractName: 'questContract',
            packageName: shared,
          }),
          OwnerIndexOwnerStub({
            ownerName: 'AlphaThing',
            contractName: 'alphaThingContract',
            packageName: alpha,
          }),
        ],
        packages: [
          OwnerIndexPackageStub({ name: alpha, dependencies: [shared] }),
          OwnerIndexPackageStub({ name: shared }),
        ],
      });

      const result = ownerIndexOwnersReachableTransformer({ ownerIndex, packageName: shared });

      expect(result.map((owner) => owner.contractName)).toStrictEqual(['questContract']);
    });
  });

  describe('empty input', () => {
    it('EMPTY: {package unknown to the index} => returns no owners', () => {
      const ownerIndex = OwnerIndexStub({
        owners: [
          OwnerIndexOwnerStub({
            ownerName: 'Quest',
            contractName: 'questContract',
            packageName: shared,
          }),
        ],
      });

      expect(
        ownerIndexOwnersReachableTransformer({ ownerIndex, packageName: stranger }),
      ).toStrictEqual([]);
    });
  });
});
