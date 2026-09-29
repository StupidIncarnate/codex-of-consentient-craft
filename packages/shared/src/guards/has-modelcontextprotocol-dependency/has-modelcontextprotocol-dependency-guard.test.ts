import { hasModelcontextprotocolDependencyGuard } from './has-modelcontextprotocol-dependency-guard';
import { PackageJsonStub } from '../../contracts/package-json/package-json.stub';

describe('hasModelcontextprotocolDependencyGuard', () => {
  describe('true cases', () => {
    it('VALID: packageJson has the MCP SDK in dependencies => returns true', () => {
      const packageJson = PackageJsonStub({
        dependencies: { '@modelcontextprotocol/sdk': '^1.0.0' },
      });

      const result = hasModelcontextprotocolDependencyGuard({ packageJson });

      expect(result).toBe(true);
    });
  });

  describe('false cases', () => {
    it('INVALID: packageJson lists other dependencies only => returns false', () => {
      const packageJson = PackageJsonStub({ dependencies: { zod: '3.0.0' } });

      const result = hasModelcontextprotocolDependencyGuard({ packageJson });

      expect(result).toBe(false);
    });

    it('EMPTY: packageJson has no dependencies field => returns false', () => {
      const packageJson = PackageJsonStub({ name: '@dungeonmaster/server' });

      const result = hasModelcontextprotocolDependencyGuard({ packageJson });

      expect(result).toBe(false);
    });

    it('EMPTY: packageJson is undefined => returns false', () => {
      const result = hasModelcontextprotocolDependencyGuard({});

      expect(result).toBe(false);
    });
  });
});
