import { workspaceRootFindMiddleware } from './workspace-root-find-middleware';
import { workspaceRootFindMiddlewareProxy } from './workspace-root-find-middleware.proxy';
import { FilePathStub } from '../../contracts/file-path/file-path.stub';

describe('workspaceRootFindMiddleware', () => {
  describe('immediate match', () => {
    it('VALID: {dirPath: a workspaces root} => returns dirPath', () => {
      const proxy = workspaceRootFindMiddlewareProxy();
      proxy.setupWorkspaceRootAt({ dirPath: '/repo' });
      const dirPath = FilePathStub({ value: '/repo' });

      const result = workspaceRootFindMiddleware({ dirPath });

      expect(result).toBe('/repo');
    });
  });

  describe('walking up', () => {
    it('VALID: {dirPath: nested past a plain package.json} => returns the ancestor workspaces root', () => {
      const proxy = workspaceRootFindMiddlewareProxy();
      proxy.setupPlainPackageAt({ dirPath: '/repo/packages/bin/src' });
      proxy.setupPlainPackageAt({ dirPath: '/repo/packages' });
      proxy.setupWorkspaceRootAt({ dirPath: '/repo' });
      const dirPath = FilePathStub({ value: '/repo/packages/bin/src' });

      const result = workspaceRootFindMiddleware({ dirPath });

      expect(result).toBe('/repo');
    });
  });

  describe('not found', () => {
    it('EMPTY: {no ancestor package.json declares workspaces} => returns null', () => {
      workspaceRootFindMiddlewareProxy();
      const dirPath = FilePathStub({ value: '/unreachable/deep/path' });

      const result = workspaceRootFindMiddleware({ dirPath });

      expect(result).toBe(null);
    });
  });
});
