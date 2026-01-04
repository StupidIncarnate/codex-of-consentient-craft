import { devDependenciesStatics } from './dev-dependencies-statics';

describe('devDependenciesStatics', () => {
  describe('packages', () => {
    it('VALID: packages.typescript => returns version string', () => {
      expect(devDependenciesStatics.packages.typescript).toBe('^5.8.3');
    });

    it('VALID: packages.eslint => returns version string', () => {
      expect(devDependenciesStatics.packages.eslint).toBe('^9.36.0');
    });

    it('VALID: packages.jest => returns version string', () => {
      expect(devDependenciesStatics.packages.jest).toBe('^30.0.4');
    });

    it('VALID: packages.tsx => returns version string', () => {
      expect(devDependenciesStatics.packages.tsx).toBe('^4.0.0');
    });

    it('VALID: packages => contains all 20 required packages', () => {
      const packageCount = Object.keys(devDependenciesStatics.packages).length;

      expect(packageCount).toBe(20);
    });
  });
});
