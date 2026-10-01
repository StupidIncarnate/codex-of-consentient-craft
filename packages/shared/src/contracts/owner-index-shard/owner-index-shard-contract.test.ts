import { OwnerIndexShardStub } from './owner-index-shard.stub';
import { ownerIndexShardContract } from './owner-index-shard-contract';

describe('ownerIndexShardContract', () => {
  describe('valid inputs', () => {
    it('VALID: {stub} => parses to the same shard', () => {
      const stub = OwnerIndexShardStub();

      expect(ownerIndexShardContract.parse(stub)).toStrictEqual({
        schemaVersion: 2,
        sharedVersion: '0.1.0',
        packageName: '@repo/alpha',
        packageDir: '/repo/packages/alpha',
        files: [],
      });
    });

    it('VALID: {one file with nothing read from it} => keeps the file stats and empty lists', () => {
      const stub = OwnerIndexShardStub({
        files: [
          {
            filePath: '/repo/packages/alpha/src/contracts/x/x-contract.ts',
            contentHash: 'a'.repeat(64),
            owners: [],
            standaloneBrands: [],
            enums: [],
          },
        ],
      });

      expect(ownerIndexShardContract.parse(stub).files).toStrictEqual([
        {
          filePath: '/repo/packages/alpha/src/contracts/x/x-contract.ts',
          contentHash: 'a'.repeat(64),
          owners: [],
          standaloneBrands: [],
          enums: [],
        },
      ]);
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {schemaVersion: "1"} => throws', () => {
      expect(() =>
        ownerIndexShardContract.parse({ ...OwnerIndexShardStub(), schemaVersion: '1' }),
      ).toThrow(/expected number/iu);
    });

    it('INVALID: {contentHash: not a sha256 hex digest} => throws', () => {
      expect(() =>
        ownerIndexShardContract.parse({
          ...OwnerIndexShardStub(),
          files: [
            {
              filePath: '/repo/packages/alpha/src/contracts/x/x-contract.ts',
              contentHash: 'abc',
              owners: [],
              standaloneBrands: [],
              enums: [],
            },
          ],
        }),
      ).toThrow(/Invalid string/u);
    });

    it('INVALID: {packageDir: relative} => throws', () => {
      expect(() =>
        ownerIndexShardContract.parse({ ...OwnerIndexShardStub(), packageDir: 'packages/alpha' }),
      ).toThrow(/Path must be absolute/u);
    });
  });
});
