import { nearestPackageJsonFindMiddleware } from './nearest-package-json-find-middleware';
import { nearestPackageJsonFindMiddlewareProxy } from './nearest-package-json-find-middleware.proxy';
import { FilePathStub } from '../../contracts/file-path/file-path.stub';

describe('nearestPackageJsonFindMiddleware', () => {
  describe('immediate match', () => {
    it('VALID: {dirPath: a directory with its own package.json} => returns its parsed content', () => {
      const proxy = nearestPackageJsonFindMiddlewareProxy();
      proxy.setupPackageJsonAt({
        dirPath: '/repo/packages/mcp',
        packageJson: {
          name: '@dungeonmaster/mcp',
          imports: { '#gateway/npm/*': '@dungeonmaster/npm/*' },
        },
      });
      const dirPath = FilePathStub({ value: '/repo/packages/mcp' });

      const result = nearestPackageJsonFindMiddleware({ dirPath });

      expect(result).toStrictEqual({
        name: '@dungeonmaster/mcp',
        imports: { '#gateway/npm/*': '@dungeonmaster/npm/*' },
      });
    });
  });

  describe('walking up', () => {
    it('VALID: {dirPath: nested past directories with no package.json} => returns the ancestor package.json', () => {
      const proxy = nearestPackageJsonFindMiddlewareProxy();
      proxy.setupMissingAt({ dirPath: '/repo/packages/mcp/src/brokers/file/scanner' });
      proxy.setupMissingAt({ dirPath: '/repo/packages/mcp/src/brokers/file' });
      proxy.setupMissingAt({ dirPath: '/repo/packages/mcp/src/brokers' });
      proxy.setupMissingAt({ dirPath: '/repo/packages/mcp/src' });
      proxy.setupPackageJsonAt({
        dirPath: '/repo/packages/mcp',
        packageJson: { name: '@dungeonmaster/mcp' },
      });
      const dirPath = FilePathStub({ value: '/repo/packages/mcp/src/brokers/file/scanner' });

      const result = nearestPackageJsonFindMiddleware({ dirPath });

      expect(result).toStrictEqual({ name: '@dungeonmaster/mcp' });
    });
  });

  describe('not found', () => {
    it('EMPTY: {no ancestor has a package.json} => returns null', () => {
      nearestPackageJsonFindMiddlewareProxy();
      const dirPath = FilePathStub({ value: '/unreachable/deep/path' });

      const result = nearestPackageJsonFindMiddleware({ dirPath });

      expect(result).toBe(null);
    });
  });
});
