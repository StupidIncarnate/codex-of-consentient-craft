import { resolvePackageGroupsLayerBrokerProxy } from './resolve-package-groups-layer-broker.proxy';
import { resolvePackageGroupsLayerBroker } from './resolve-package-groups-layer-broker';

describe('resolvePackageGroupsLayerBroker', () => {
  describe('single package per group', () => {
    it('VALID: {one hono-constructing package, one frontend-react package} => buckets each into its own set', () => {
      const proxy = resolvePackageGroupsLayerBrokerProxy();
      proxy.setupPackagesDir({ projectRoot: '/repo', packageDirNames: ['server', 'web'] });
      proxy.setupPackage({
        packageRoot: '/repo/packages/server',
        srcDirNames: ['flows'],
        packageJsonContent: JSON.stringify({ dependencies: { hono: '^4.0.0' } }),
      });
      proxy.setupPackage({
        packageRoot: '/repo/packages/web',
        srcDirNames: ['widgets'],
        packageJsonContent: JSON.stringify({ dependencies: { react: '18.2.0' } }),
      });

      const result = resolvePackageGroupsLayerBroker({
        projectRoot: '/repo',
      });

      expect(result).toStrictEqual({
        httpBackendRoots: ['/repo/packages/server'],
        frontendRoots: ['/repo/packages/web'],
      });
    });
  });

  describe('a package reaching Hono through the gateway', () => {
    it('VALID: {a flow file constructing new Hono()} => buckets into httpBackendRoots', () => {
      const proxy = resolvePackageGroupsLayerBrokerProxy();
      proxy.setupPackagesDir({ projectRoot: '/repo', packageDirNames: ['server', 'lib'] });
      proxy.setupPackage({
        packageRoot: '/repo/packages/server',
        srcDirNames: ['flows'],
        flowFiles: [
          {
            name: 'health-flow.ts',
            content: "import { Hono } from '#gateway/npm/hono';\nconst app = new Hono();",
          },
        ],
      });
      proxy.setupPackage({
        packageRoot: '/repo/packages/lib',
        srcDirNames: ['flows'],
        flowFiles: [{ name: 'lib-flow.ts', content: 'export const libFlow = () => [];' }],
      });

      const result = resolvePackageGroupsLayerBroker({
        projectRoot: '/repo',
      });

      expect(result).toStrictEqual({
        httpBackendRoots: ['/repo/packages/server'],
        frontendRoots: [],
      });
    });
  });

  describe('a package declaring hono beside a flows folder', () => {
    it('VALID: {hono in dependencies, flows folder, flow files that do not construct the app} => buckets into httpBackendRoots', () => {
      const proxy = resolvePackageGroupsLayerBrokerProxy();
      proxy.setupPackagesDir({ projectRoot: '/repo', packageDirNames: ['api'] });
      proxy.setupPackage({
        packageRoot: '/repo/packages/api',
        srcDirNames: ['flows'],
        packageJsonContent: JSON.stringify({ dependencies: { hono: '^4.0.0' } }),
      });

      const result = resolvePackageGroupsLayerBroker({
        projectRoot: '/repo',
      });

      expect(result).toStrictEqual({
        httpBackendRoots: ['/repo/packages/api'],
        frontendRoots: [],
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
        srcDirNames: ['widgets'],
        packageJsonContent: JSON.stringify({ dependencies: { ink: '^5.0.0' } }),
      });

      const result = resolvePackageGroupsLayerBroker({
        projectRoot: '/repo',
      });

      expect(result).toStrictEqual({
        httpBackendRoots: [],
        frontendRoots: ['/repo/packages/web', '/repo/packages/tui'],
      });
    });
  });

  describe('a package that is neither', () => {
    it('INVALID: {library package, no flows, no widgets} => appears in neither set', () => {
      const proxy = resolvePackageGroupsLayerBrokerProxy();
      proxy.setupPackagesDir({ projectRoot: '/repo', packageDirNames: ['shared'] });
      proxy.setupPackage({ packageRoot: '/repo/packages/shared', srcDirNames: ['contracts'] });

      const result = resolvePackageGroupsLayerBroker({
        projectRoot: '/repo',
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
        projectRoot: '/repo',
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
        projectRoot: '/repo',
      });

      expect(result).toStrictEqual({ httpBackendRoots: [], frontendRoots: [] });
    });
  });
});
