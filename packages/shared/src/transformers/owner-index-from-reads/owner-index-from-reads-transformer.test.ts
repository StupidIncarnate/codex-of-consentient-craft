import { ContractFileOwnersReadLayerStub } from '../../contracts/contract-file-owners-read-layer/contract-file-owners-read-layer.stub';
import { OwnerIndexOwnerStub } from '../../contracts/owner-index-owner/owner-index-owner.stub';
import { OwnerIndexPackageStub } from '../../contracts/owner-index-package/owner-index-package.stub';
import { OwnerIndexStandaloneBrandStub } from '../../contracts/owner-index-standalone-brand/owner-index-standalone-brand.stub';
import { ownerIndexFromReadsTransformer } from './owner-index-from-reads-transformer';

const alphaPackage = OwnerIndexPackageStub({ name: '@repo/alpha', dir: '/repo/packages/alpha' });
const owner = OwnerIndexOwnerStub({
  ownerName: 'StartInput',
  contractName: 'startInputContract',
  filePath: '/repo/packages/alpha/src/contracts/start-input/start-input-contract.ts',
  packageName: '@repo/alpha',
  schemaText: 'z.object({ itemId: itemIdContract })',
  fields: [{ key: 'itemId', kind: 'contract-ref', refContractName: 'itemIdContract' }] as never,
});

describe('ownerIndexFromReadsTransformer', () => {
  describe('brand-ref resolution', () => {
    it('VALID: {a contract-ref to a standalone brand read from another file} => turns it into a brand-ref', () => {
      const brand = OwnerIndexStandaloneBrandStub({
        contractName: 'itemIdContract',
        brandText: 'ItemId',
      });

      const result = ownerIndexFromReadsTransformer({
        packages: [alphaPackage],
        reads: [
          ContractFileOwnersReadLayerStub({ owners: [owner] }),
          ContractFileOwnersReadLayerStub({ standaloneBrands: [brand] }),
        ],
      });

      expect(result).toStrictEqual({
        owners: [
          {
            ...owner,
            fields: [
              {
                key: 'itemId',
                kind: 'brand-ref',
                refContractName: 'itemIdContract',
                brandText: 'ItemId',
              },
            ],
          },
        ],
        standaloneBrands: [brand],
        enums: [],
        packages: [alphaPackage],
      });
    });

    it('VALID: {a standalone brand name with two brand texts} => leaves the key a contract-ref', () => {
      const result = ownerIndexFromReadsTransformer({
        packages: [alphaPackage],
        reads: [
          ContractFileOwnersReadLayerStub({
            owners: [owner],
            standaloneBrands: [
              OwnerIndexStandaloneBrandStub({
                contractName: 'itemIdContract',
                brandText: 'ItemId',
              }),
              OwnerIndexStandaloneBrandStub({
                contractName: 'itemIdContract',
                brandText: 'OtherId',
              }),
            ],
          }),
        ],
      });

      expect(result.owners).toStrictEqual([owner]);
    });
  });

  describe('empty input', () => {
    it('EMPTY: {no reads} => returns an empty index carrying the packages', () => {
      const result = ownerIndexFromReadsTransformer({ packages: [alphaPackage], reads: [] });

      expect(result).toStrictEqual({
        owners: [],
        standaloneBrands: [],
        enums: [],
        packages: [alphaPackage],
      });
    });
  });
});
