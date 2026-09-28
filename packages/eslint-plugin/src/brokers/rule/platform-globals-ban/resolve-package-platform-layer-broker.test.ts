import { resolvePackagePlatformLayerBroker } from './resolve-package-platform-layer-broker';
import { resolvePackagePlatformLayerBrokerProxy } from './resolve-package-platform-layer-broker.proxy';

describe('resolvePackagePlatformLayerBroker', () => {
  describe('browser packages', () => {
    it('VALID: {widgets folder + react dependency} => returns "browser"', () => {
      const proxy = resolvePackagePlatformLayerBrokerProxy();
      proxy.setupNoPackageRoot({
        dirs: ['/repo/packages/web-a/src/widgets', '/repo/packages/web-a/src'],
      });
      proxy.setupPackageRoot({
        packageRoot: '/repo/packages/web-a',
        packageJson: { name: '@dungeonmaster/web-a', dependencies: { react: '18.2.0' } },
        hasWidgetsFolder: true,
      });

      const result = resolvePackagePlatformLayerBroker({
        filename: '/repo/packages/web-a/src/widgets/x.tsx',
      });

      expect(result).toBe('browser');
    });

    it('VALID: {widgets folder + ink adapter, no react} => returns "browser"', () => {
      const proxy = resolvePackagePlatformLayerBrokerProxy();
      proxy.setupNoPackageRoot({
        dirs: ['/repo/packages/cli-a/src/widgets', '/repo/packages/cli-a/src'],
      });
      proxy.setupPackageRoot({
        packageRoot: '/repo/packages/cli-a',
        packageJson: { name: '@dungeonmaster/cli-a' },
        hasWidgetsFolder: true,
        hasInkAdapter: true,
      });

      const result = resolvePackagePlatformLayerBroker({
        filename: '/repo/packages/cli-a/src/widgets/x.tsx',
      });

      expect(result).toBe('browser');
    });
  });

  describe('node packages', () => {
    it('VALID: {no widgets folder} => returns "node"', () => {
      const proxy = resolvePackagePlatformLayerBrokerProxy();
      proxy.setupNoPackageRoot({
        dirs: ['/repo/packages/hooks-a/src/startup', '/repo/packages/hooks-a/src'],
      });
      proxy.setupPackageRoot({
        packageRoot: '/repo/packages/hooks-a',
        packageJson: { name: '@dungeonmaster/hooks-a' },
      });

      const result = resolvePackagePlatformLayerBroker({
        filename: '/repo/packages/hooks-a/src/startup/y.ts',
      });

      expect(result).toBe('node');
    });

    it('VALID: {widgets folder but no react and no ink} => returns "node"', () => {
      const proxy = resolvePackagePlatformLayerBrokerProxy();
      proxy.setupNoPackageRoot({
        dirs: ['/repo/packages/lib-a/src/widgets', '/repo/packages/lib-a/src'],
      });
      proxy.setupPackageRoot({
        packageRoot: '/repo/packages/lib-a',
        packageJson: { name: '@dungeonmaster/lib-a' },
        hasWidgetsFolder: true,
      });

      const result = resolvePackagePlatformLayerBroker({
        filename: '/repo/packages/lib-a/src/widgets/y.ts',
      });

      expect(result).toBe('node');
    });
  });

  describe('missing package root', () => {
    it('EMPTY: {no ancestor package.json} => returns "node"', () => {
      const proxy = resolvePackagePlatformLayerBrokerProxy();
      proxy.setupNoPackageRoot({ dirs: ['/orphan/src', '/orphan', '/'] });

      const result = resolvePackagePlatformLayerBroker({
        filename: '/orphan/src/y.ts',
      });

      expect(result).toBe('node');
    });
  });

  describe('caching', () => {
    it('VALID: {same package root twice} => reads package.json only once', () => {
      const proxy = resolvePackagePlatformLayerBrokerProxy();
      proxy.setupNoPackageRoot({
        dirs: ['/repo/packages/cache-a/src/widgets', '/repo/packages/cache-a/src'],
      });
      proxy.setupPackageRoot({
        packageRoot: '/repo/packages/cache-a',
        packageJson: { name: '@dungeonmaster/cache-a', dependencies: { react: '18.2.0' } },
        hasWidgetsFolder: true,
      });

      resolvePackagePlatformLayerBroker({ filename: '/repo/packages/cache-a/src/widgets/a.tsx' });
      resolvePackagePlatformLayerBroker({ filename: '/repo/packages/cache-a/src/widgets/b.tsx' });

      const readCount = proxy.countPackageJsonReads({ packageRoot: '/repo/packages/cache-a' });

      expect(readCount).toBe(1);
    });
  });
});
