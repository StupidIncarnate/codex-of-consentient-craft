import { specifierMatchesPackageGuard } from './specifier-matches-package-guard';

describe('specifierMatchesPackageGuard', () => {
  describe('valid inputs', () => {
    it('VALID: {specifier: "@dungeonmaster/node", packageName: "@dungeonmaster/node"} => returns true', () => {
      const result = specifierMatchesPackageGuard({
        specifier: '@dungeonmaster/node',
        packageName: '@dungeonmaster/node',
      });

      expect(result).toBe(true);
    });

    it('VALID: {specifier: "@dungeonmaster/node/fs", packageName: "@dungeonmaster/node"} => returns true', () => {
      const result = specifierMatchesPackageGuard({
        specifier: '@dungeonmaster/node/fs',
        packageName: '@dungeonmaster/node',
      });

      expect(result).toBe(true);
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {specifier: "@dungeonmaster/nodejs", packageName: "@dungeonmaster/node"} => returns false', () => {
      const result = specifierMatchesPackageGuard({
        specifier: '@dungeonmaster/nodejs',
        packageName: '@dungeonmaster/node',
      });

      expect(result).toBe(false);
    });

    it('INVALID: {specifier: "@dungeonmaster/browser/fetch", packageName: "@dungeonmaster/node"} => returns false', () => {
      const result = specifierMatchesPackageGuard({
        specifier: '@dungeonmaster/browser/fetch',
        packageName: '@dungeonmaster/node',
      });

      expect(result).toBe(false);
    });
  });

  describe('empty input', () => {
    it('EMPTY: {no specifier} => returns false', () => {
      const result = specifierMatchesPackageGuard({ packageName: '@dungeonmaster/node' });

      expect(result).toBe(false);
    });

    it('EMPTY: {no packageName} => returns false', () => {
      const result = specifierMatchesPackageGuard({ specifier: '@dungeonmaster/node' });

      expect(result).toBe(false);
    });
  });
});
