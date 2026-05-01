import { reactInDepsGuard } from './react-in-deps-guard';
import { PackageJsonStub } from '../../contracts/package-json/package-json.stub';

describe('reactInDepsGuard', () => {
  describe('true cases', () => {
    it('VALID: packageJson has react in dependencies => returns true', () => {
      const packageJson = PackageJsonStub({ dependencies: { react: '18.0.0' } });

      const result = reactInDepsGuard({ packageJson });

      expect(result).toBe(true);
    });
  });

  describe('false cases', () => {
    it('INVALID: packageJson has no react in dependencies => returns false', () => {
      const packageJson = PackageJsonStub({ dependencies: { zod: '3.0.0' } });

      const result = reactInDepsGuard({ packageJson });

      expect(result).toBe(false);
    });

    it('EMPTY: packageJson has no dependencies field => returns false', () => {
      const packageJson = PackageJsonStub({ name: '@dungeonmaster/server' });

      const result = reactInDepsGuard({ packageJson });

      expect(result).toBe(false);
    });

    it('EMPTY: packageJson is undefined => returns false', () => {
      const result = reactInDepsGuard({});

      expect(result).toBe(false);
    });
  });
});
