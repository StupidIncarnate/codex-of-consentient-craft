import { findRepoRootLayerBroker } from './find-repo-root-layer-broker';
import { findRepoRootLayerBrokerProxy } from './find-repo-root-layer-broker.proxy';
import { FilePathStub } from '../../../contracts/file-path/file-path.stub';

describe('findRepoRootLayerBroker', () => {
  describe('immediate match', () => {
    it('VALID: {startPath: dir with a workspaces package.json} => returns startPath', () => {
      const proxy = findRepoRootLayerBrokerProxy();
      proxy.setupWorkspacesRootAt({ dirPath: '/fake/repo' });

      const result = findRepoRootLayerBroker({
        startPath: FilePathStub({ value: '/fake/repo' }),
      });

      expect(result).toBe('/fake/repo');
    });
  });

  describe('walking up', () => {
    it('VALID: {startPath: nested dir past a plain package.json} => returns the ancestor workspaces root', () => {
      const proxy = findRepoRootLayerBrokerProxy();
      proxy.setupPlainPackageAt({ dirPath: '/fake/repo/packages/sub' });
      proxy.setupWorkspacesRootAt({ dirPath: '/fake/repo' });

      const result = findRepoRootLayerBroker({
        startPath: FilePathStub({ value: '/fake/repo/packages/sub/src' }),
      });

      expect(result).toBe('/fake/repo');
    });
  });

  describe('not found', () => {
    it('ERROR: {startPath: no ancestor package.json has a workspaces field} => throws naming startPath', () => {
      findRepoRootLayerBrokerProxy();

      expect(() =>
        findRepoRootLayerBroker({
          startPath: FilePathStub({ value: '/fake-unreachable/deep/path' }),
        }),
      ).toThrow(
        /^findRepoRootLayerBroker: reached the filesystem root without finding a package\.json with a workspaces field, starting from \/fake-unreachable\/deep\/path$/u,
      );
    });
  });
});
