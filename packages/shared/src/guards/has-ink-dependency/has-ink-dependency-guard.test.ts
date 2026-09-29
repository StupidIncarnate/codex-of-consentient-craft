import { hasInkDependencyGuard } from './has-ink-dependency-guard';
import { PackageJsonStub } from '../../contracts/package-json/package-json.stub';

describe('hasInkDependencyGuard', () => {
  describe('true cases', () => {
    it('VALID: packageJson has ink in dependencies => returns true', () => {
      const packageJson = PackageJsonStub({ dependencies: { ink: '^5.0.0' } });

      const result = hasInkDependencyGuard({ packageJson });

      expect(result).toBe(true);
    });
  });

  describe('false cases', () => {
    it('INVALID: packageJson has no ink in dependencies => returns false', () => {
      const packageJson = PackageJsonStub({ dependencies: { react: '19.0.0' } });

      const result = hasInkDependencyGuard({ packageJson });

      expect(result).toBe(false);
    });

    it('EMPTY: packageJson has no dependencies field => returns false', () => {
      const packageJson = PackageJsonStub({ name: '@dungeonmaster/server' });

      const result = hasInkDependencyGuard({ packageJson });

      expect(result).toBe(false);
    });

    it('EMPTY: packageJson is undefined => returns false', () => {
      const result = hasInkDependencyGuard({});

      expect(result).toBe(false);
    });
  });
});
