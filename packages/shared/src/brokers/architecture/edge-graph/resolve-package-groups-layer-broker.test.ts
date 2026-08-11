import { AbsoluteFilePathStub } from '../../../contracts/absolute-file-path/absolute-file-path.stub';
import { resolvePackageGroupsLayerBrokerProxy } from './resolve-package-groups-layer-broker.proxy';
import { resolvePackageGroupsLayerBroker } from './resolve-package-groups-layer-broker';

describe('resolvePackageGroupsLayerBroker', () => {
  describe('single package per group', () => {
    it('VALID: {one http-backend package, one frontend-react package} => buckets each into its own set', () => {
      const proxy = resolvePackageGroupsLayerBrokerProxy();
      proxy.setupPackagesDir({ projectRoot: '/repo', packageDirNames: ['server', 'web'] });
      proxy.setupPackage({ packageRoot: '/repo/packages/server', adapterDirNames: ['hono'] });
      proxy.setupPackage({
        packageRoot: '/repo/packages/web',
        srcDirNames: ['widgets'],
        packageJsonContent: JSON.stringify({ dependencies: { react: '18.2.0' } }),
      });

      const result = resolvePackageGroupsLayerBroker({
        projectRoot: AbsoluteFilePathStub({ value: '/repo' }),
      });

      expect(result).toStrictEqual({
        httpBackendRoots: [AbsoluteFilePathStub({ value: '/repo/packages/server' })],
        frontendRoots: [AbsoluteFilePathStub({ value: '/repo/packages/web' })],
      });
    });
  });

  describe('a set of two UI packages', () => {
    it('VALID: {frontend-react web, frontend-ink tui} => both land in frontendRoots', () => {
      const proxy = resolvePackageGroupsLayerBrokerProxy();
      proxy.setupPackagesDir({ projectRoot: '/repo', packageDirNames: ['web', 'tui'] });
      proxy.setupPackage({
        packageRoot: '/repo/packages/web',
        srcDirNames: ['widgets'],
        packageJsonContent: JSON.stringify({ dependencies: { react: '18.2.0' } }),
      });
      proxy.setupPackage({
        packageRoot: '/repo/packages/tui',
        srcDirNames: ['widgets', 'adapters'],
        adapterDirNames: ['ink'],
      });

      const result = resolvePackageGroupsLayerBroker({
        projectRoot: AbsoluteFilePathStub({ value: '/repo' }),
      });

      expect(result).toStrictEqual({
        httpBackendRoots: [],
        frontendRoots: [
          AbsoluteFilePathStub({ value: '/repo/packages/web' }),
          AbsoluteFilePathStub({ value: '/repo/packages/tui' }),
        ],
      });
    });
  });

  describe('a package that is neither', () => {
    it('INVALID: {library package, no adapters, no widgets} => appears in neither set', () => {
      const proxy = resolvePackageGroupsLayerBrokerProxy();
      proxy.setupPackagesDir({ projectRoot: '/repo', packageDirNames: ['shared'] });
      proxy.setupPackage({ packageRoot: '/repo/packages/shared', srcDirNames: ['contracts'] });

      const result = resolvePackageGroupsLayerBroker({
        projectRoot: AbsoluteFilePathStub({ value: '/repo' }),
      });

      expect(result).toStrictEqual({ httpBackendRoots: [], frontendRoots: [] });
    });
  });

  describe('malformed package.json', () => {
    it('EDGE: {package.json read returns a non-JSON string} => treats it as no signals instead of throwing', () => {
      // A caller that discovers 'server' via setupPackagesDir but never stages its own
      // setupPackage(...) leaves package.json reads falling through to the raw adapter's
      // constructor default (an empty string), which is not valid JSON. This must not crash the
      // whole scan — it must resolve as "not http-backend, not frontend" instead.
      const proxy = resolvePackageGroupsLayerBrokerProxy();
      proxy.setupPackagesDir({ projectRoot: '/repo', packageDirNames: ['server'] });

      const result = resolvePackageGroupsLayerBroker({
        projectRoot: AbsoluteFilePathStub({ value: '/repo' }),
      });

      expect(result).toStrictEqual({ httpBackendRoots: [], frontendRoots: [] });
    });
  });

  describe('empty package', () => {
    it('EMPTY: {no packages/ directory} => both sets empty', () => {
      // No packages/ dir => candidateRoots falls back to [projectRoot] itself; give that single
      // candidate a valid (empty) package.json so the read doesn't crash on JSON.parse('').
      const proxy = resolvePackageGroupsLayerBrokerProxy();
      proxy.setupPackage({ packageRoot: '/repo' });

      const result = resolvePackageGroupsLayerBroker({
        projectRoot: AbsoluteFilePathStub({ value: '/repo' }),
      });

      expect(result).toStrictEqual({ httpBackendRoots: [], frontendRoots: [] });
    });
  });
});
