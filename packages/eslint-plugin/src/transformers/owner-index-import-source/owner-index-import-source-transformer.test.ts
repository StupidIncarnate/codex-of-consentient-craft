import { ownerIndexImportSourceTransformer } from './owner-index-import-source-transformer';

describe('ownerIndexImportSourceTransformer', () => {
  describe('one package', () => {
    it('VALID: {owner in a sibling contract folder} => climbs one folder and descends', () => {
      const result = ownerIndexImportSourceTransformer({
        ownerFilePath: '/repo/packages/a/src/contracts/quest/quest-contract.ts',
        ownerPackageName: '@repo/a',
        filePath: '/repo/packages/a/src/contracts/work-item/work-item-contract.ts',
        packageName: '@repo/a',
      });

      expect(result).toBe('../quest/quest-contract');
    });

    it('VALID: {caller in a broker two folders deep} => climbs to the contracts folder', () => {
      const result = ownerIndexImportSourceTransformer({
        ownerFilePath: '/repo/packages/a/src/contracts/quest/quest-contract.ts',
        ownerPackageName: '@repo/a',
        filePath: '/repo/packages/a/src/brokers/quest/load/quest-load-broker.ts',
        packageName: '@repo/a',
      });

      expect(result).toBe('../../../contracts/quest/quest-contract');
    });

    it('EDGE: {owner in the caller folder} => starts with ./', () => {
      const result = ownerIndexImportSourceTransformer({
        ownerFilePath: '/repo/packages/a/src/contracts/quest/quest-contract.ts',
        ownerPackageName: '@repo/a',
        filePath: '/repo/packages/a/src/contracts/quest/quest-layer-contract.ts',
        packageName: '@repo/a',
      });

      expect(result).toBe('./quest-contract');
    });
  });

  describe('two packages', () => {
    it('VALID: {owner in another package} => the owner package contracts subpath', () => {
      const result = ownerIndexImportSourceTransformer({
        ownerFilePath: '/repo/packages/b/src/contracts/quest/quest-contract.ts',
        ownerPackageName: '@repo/b',
        filePath: '/repo/packages/a/src/brokers/quest/load/quest-load-broker.ts',
        packageName: '@repo/a',
      });

      expect(result).toBe('@repo/b/contracts');
    });
  });
});
