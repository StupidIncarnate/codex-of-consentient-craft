import { folderConfigStatics } from '@dungeonmaster/shared/statics';

import { isPackageBarrelFileGuard } from './is-package-barrel-file-guard';

const FOLDER_TYPES = Object.keys(folderConfigStatics);

describe('isPackageBarrelFileGuard', () => {
  describe('barrel files', () => {
    it.each(FOLDER_TYPES)('VALID: {filename: src/%s barrel} => returns true', (folderType) => {
      const result = isPackageBarrelFileGuard({
        filename: `/repo/packages/shared/src/${folderType}/${folderType}.ts`,
      });

      expect(result).toBe(true);
    });

    it('VALID: {filename: the @types barrel} => returns true', () => {
      const result = isPackageBarrelFileGuard({
        filename: '/repo/packages/shared/src/@types/@types.ts',
      });

      expect(result).toBe(true);
    });
  });

  describe('non-barrel files', () => {
    it('INVALID: {filename: an entry file} => returns false', () => {
      const result = isPackageBarrelFileGuard({
        filename: '/repo/packages/shared/src/contracts/user/user-contract.ts',
      });

      expect(result).toBe(false);
    });

    it('INVALID: {filename: a barrel-named file one folder deeper} => returns false', () => {
      const result = isPackageBarrelFileGuard({
        filename: '/repo/packages/shared/src/contracts/contracts/contracts.ts',
      });

      expect(result).toBe(false);
    });

    it('INVALID: {filename: a barrel-named file outside src} => returns false', () => {
      const result = isPackageBarrelFileGuard({
        filename: '/repo/packages/shared/contracts/contracts.ts',
      });

      expect(result).toBe(false);
    });

    it('INVALID: {filename: a folder-named file in an unknown folder} => returns false', () => {
      const result = isPackageBarrelFileGuard({
        filename: '/repo/packages/shared/src/things/things.ts',
      });

      expect(result).toBe(false);
    });

    it('INVALID: {filename: the barrel proxy} => returns false', () => {
      const result = isPackageBarrelFileGuard({
        filename: '/repo/packages/shared/src/brokers/brokers.proxy.ts',
      });

      expect(result).toBe(false);
    });

    it('INVALID: {filename: a .tsx file named after its folder} => returns false', () => {
      const result = isPackageBarrelFileGuard({
        filename: '/repo/packages/web/src/widgets/widgets.tsx',
      });

      expect(result).toBe(false);
    });

    it('EMPTY: {filename: undefined} => returns false', () => {
      const result = isPackageBarrelFileGuard({});

      expect(result).toBe(false);
    });
  });
});
