import { OwnerIndexStub } from '@dungeonmaster/shared/contracts/owner-index/owner-index.stub';
import { OwnerIndexPackageStub } from '@dungeonmaster/shared/contracts/owner-index-package/owner-index-package.stub';

import { ownerIndexFilePackageTransformer } from './owner-index-file-package-transformer';

describe('ownerIndexFilePackageTransformer', () => {
  describe('a file under an indexed package', () => {
    it('VALID: {file under alpha} => returns alpha', () => {
      const ownerIndex = OwnerIndexStub({
        packages: [
          OwnerIndexPackageStub({ name: '@repo/alpha', dir: '/repo/packages/alpha' }),
          OwnerIndexPackageStub({ name: '@repo/beta', dir: '/repo/packages/beta' }),
        ],
      });

      const result = ownerIndexFilePackageTransformer({
        ownerIndex,
        filePath: '/repo/packages/alpha/src/x/x-broker.ts',
      });

      expect(result).toBe('@repo/alpha');
    });

    it('EDGE: {package nested under another} => returns the deepest holder', () => {
      const ownerIndex = OwnerIndexStub({
        packages: [
          OwnerIndexPackageStub({ name: '@repo/outer', dir: '/repo/packages/outer' }),
          OwnerIndexPackageStub({ name: '@repo/inner', dir: '/repo/packages/outer/inner' }),
        ],
      });

      const result = ownerIndexFilePackageTransformer({
        ownerIndex,
        filePath: '/repo/packages/outer/inner/src/x.ts',
      });

      expect(result).toBe('@repo/inner');
    });

    it('EDGE: {sibling whose name starts with the same text} => does not match the shorter one', () => {
      const ownerIndex = OwnerIndexStub({
        packages: [OwnerIndexPackageStub({ name: '@repo/al', dir: '/repo/packages/al' })],
      });

      const result = ownerIndexFilePackageTransformer({
        ownerIndex,
        filePath: '/repo/packages/alpha/src/x.ts',
      });

      expect(result).toBe(undefined);
    });
  });

  describe('a file outside every package', () => {
    it('EMPTY: {no packages} => returns undefined', () => {
      const result = ownerIndexFilePackageTransformer({
        ownerIndex: OwnerIndexStub(),
        filePath: '/repo/scripts/x.ts',
      });

      expect(result).toBe(undefined);
    });
  });
});
