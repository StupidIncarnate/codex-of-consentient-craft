import { hasHonoOrExpressDependencyGuard } from './has-hono-or-express-dependency-guard';
import { PackageJsonStub } from '../../contracts/package-json/package-json.stub';

describe('hasHonoOrExpressDependencyGuard', () => {
  describe('true cases', () => {
    it('VALID: packageJson has hono in dependencies => returns true', () => {
      const packageJson = PackageJsonStub({ dependencies: { hono: '^4.0.0' } });

      const result = hasHonoOrExpressDependencyGuard({ packageJson });

      expect(result).toBe(true);
    });

    it('VALID: packageJson has express in dependencies => returns true', () => {
      const packageJson = PackageJsonStub({ dependencies: { express: '^4.0.0' } });

      const result = hasHonoOrExpressDependencyGuard({ packageJson });

      expect(result).toBe(true);
    });
  });

  describe('false cases', () => {
    it('INVALID: packageJson has neither hono nor express => returns false', () => {
      const packageJson = PackageJsonStub({ dependencies: { zod: '3.0.0' } });

      const result = hasHonoOrExpressDependencyGuard({ packageJson });

      expect(result).toBe(false);
    });

    it('EMPTY: packageJson has no dependencies field => returns false', () => {
      const packageJson = PackageJsonStub({ name: '@dungeonmaster/server' });

      const result = hasHonoOrExpressDependencyGuard({ packageJson });

      expect(result).toBe(false);
    });

    it('EMPTY: packageJson is undefined => returns false', () => {
      const result = hasHonoOrExpressDependencyGuard({});

      expect(result).toBe(false);
    });
  });
});
