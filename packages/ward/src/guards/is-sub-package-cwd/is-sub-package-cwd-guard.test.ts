import { isSubPackageCwdGuard } from './is-sub-package-cwd-guard';

describe('isSubPackageCwdGuard', () => {
  describe('valid sub-package paths', () => {
    it('VALID: {targetPath is sub-package with package.json} => returns true', () => {
      const result = isSubPackageCwdGuard({
        targetPath: '/repo/packages/ward',
        rootPath: '/repo',
        hasPackageJson: true,
      });

      expect(result).toBe(true);
    });
  });

  describe('invalid sub-package paths', () => {
    it('INVALID_VALUE: {targetPath equals rootPath} => returns false', () => {
      const result = isSubPackageCwdGuard({
        targetPath: '/repo',
        rootPath: '/repo',
        hasPackageJson: true,
      });

      expect(result).toBe(false);
    });

    it('INVALID_VALUE: {hasPackageJson is false} => returns false', () => {
      const result = isSubPackageCwdGuard({
        targetPath: '/repo/src',
        rootPath: '/repo',
        hasPackageJson: false,
      });

      expect(result).toBe(false);
    });

    it('EMPTY: {targetPath: undefined} => returns false', () => {
      const result = isSubPackageCwdGuard({ rootPath: '/repo', hasPackageJson: true });

      expect(result).toBe(false);
    });

    it('EMPTY: {rootPath: undefined} => returns false', () => {
      const result = isSubPackageCwdGuard({
        targetPath: '/repo/packages/ward',
        hasPackageJson: true,
      });

      expect(result).toBe(false);
    });

    it('EMPTY: {hasPackageJson: undefined} => returns false', () => {
      const result = isSubPackageCwdGuard({
        targetPath: '/repo/packages/ward',
        rootPath: '/repo',
      });

      expect(result).toBe(false);
    });

    it('EMPTY: {all undefined} => returns false', () => {
      const result = isSubPackageCwdGuard({});

      expect(result).toBe(false);
    });
  });
});
