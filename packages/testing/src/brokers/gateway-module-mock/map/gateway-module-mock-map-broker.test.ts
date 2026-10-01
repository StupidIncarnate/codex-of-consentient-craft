import { gatewayModuleMockMapBroker } from './gateway-module-mock-map-broker';
import { gatewayModuleMockMapBrokerProxy } from './gateway-module-mock-map-broker.proxy';

describe('gatewayModuleMockMapBroker', () => {
  describe('a package outside the npm gateway', () => {
    it('VALID: {folder with a mock, unscoped barrel} => maps the gateway name and the raw name to the mock', () => {
      const proxy = gatewayModuleMockMapBrokerProxy();
      proxy.setupNpmGateway({
        rootDir: '/repo/packages/web',
        repoRoot: '/repo',
        folders: [{ name: 'elkjs', hasMock: true, barrelText: "export * from 'elkjs';\n" }],
      });

      const result = gatewayModuleMockMapBroker({ rootDir: '/repo/packages/web' });

      expect(result).toStrictEqual({
        '#gateway/npm/elkjs': '/repo/packages/@gateway/npm/src/elkjs/elkjs.jest-mock.cjs',
        elkjs: '/repo/packages/@gateway/npm/src/elkjs/elkjs.jest-mock.cjs',
      });
    });

    it('VALID: {scoped folder with a mock} => maps its scoped package name', () => {
      const proxy = gatewayModuleMockMapBrokerProxy();
      proxy.setupNpmGateway({
        rootDir: '/repo/packages/web',
        repoRoot: '/repo',
        folders: [
          {
            name: 'tabler__icons-react',
            hasMock: true,
            barrelText: "export * from '@tabler/icons-react';\n",
          },
        ],
      });

      const result = gatewayModuleMockMapBroker({ rootDir: '/repo/packages/web' });

      expect(result).toStrictEqual({
        '#gateway/npm/tabler__icons-react':
          '/repo/packages/@gateway/npm/src/tabler__icons-react/tabler__icons-react.jest-mock.cjs',
        '@tabler/icons-react':
          '/repo/packages/@gateway/npm/src/tabler__icons-react/tabler__icons-react.jest-mock.cjs',
      });
    });

    it('VALID: {folders with and without a mock} => maps only the folder holding one', () => {
      const proxy = gatewayModuleMockMapBrokerProxy();
      proxy.setupNpmGateway({
        rootDir: '/repo/packages/server',
        repoRoot: '/repo',
        folders: [
          { name: 'glob', hasMock: false, barrelText: "export * from 'glob';\n" },
          { name: 'xyflow__react', hasMock: true, barrelText: "export * from '@xyflow/react';\n" },
        ],
      });

      const result = gatewayModuleMockMapBroker({ rootDir: '/repo/packages/server' });

      expect(result).toStrictEqual({
        '#gateway/npm/xyflow__react':
          '/repo/packages/@gateway/npm/src/xyflow__react/xyflow__react.jest-mock.cjs',
        '@xyflow/react':
          '/repo/packages/@gateway/npm/src/xyflow__react/xyflow__react.jest-mock.cjs',
      });
    });

    it('EMPTY: {folder without a mock} => returns no mapping', () => {
      const proxy = gatewayModuleMockMapBrokerProxy();
      proxy.setupNpmGateway({
        rootDir: '/repo/packages/web',
        repoRoot: '/repo',
        folders: [{ name: 'glob', hasMock: false, barrelText: "export * from 'glob';\n" }],
      });

      const result = gatewayModuleMockMapBroker({ rootDir: '/repo/packages/web' });

      expect(result).toStrictEqual({});
    });

    it('EDGE: {folder with a mock and no barrel} => maps the gateway name alone', () => {
      const proxy = gatewayModuleMockMapBrokerProxy();
      proxy.setupNpmGateway({
        rootDir: '/repo/packages/web',
        repoRoot: '/repo',
        folders: [{ name: 'elkjs', hasMock: true, barrelText: null }],
      });

      const result = gatewayModuleMockMapBroker({ rootDir: '/repo/packages/web' });

      expect(result).toStrictEqual({
        '#gateway/npm/elkjs': '/repo/packages/@gateway/npm/src/elkjs/elkjs.jest-mock.cjs',
      });
    });

    it('VALID: {another gateway package} => maps the mock', () => {
      const proxy = gatewayModuleMockMapBrokerProxy();
      proxy.setupNpmGateway({
        rootDir: '/repo/packages/@gateway/browser',
        repoRoot: '/repo',
        folders: [{ name: 'elkjs', hasMock: true, barrelText: "export * from 'elkjs';\n" }],
      });

      const result = gatewayModuleMockMapBroker({ rootDir: '/repo/packages/@gateway/browser' });

      expect(result).toStrictEqual({
        '#gateway/npm/elkjs': '/repo/packages/@gateway/npm/src/elkjs/elkjs.jest-mock.cjs',
        elkjs: '/repo/packages/@gateway/npm/src/elkjs/elkjs.jest-mock.cjs',
      });
    });
  });

  describe('the npm gateway package itself', () => {
    it('EMPTY: {rootDir: the npm gateway} => returns no mapping', () => {
      const proxy = gatewayModuleMockMapBrokerProxy();
      proxy.setupNpmGateway({
        rootDir: '/repo/packages/@gateway/npm',
        repoRoot: '/repo',
        folders: [{ name: 'elkjs', hasMock: true, barrelText: "export * from 'elkjs';\n" }],
      });

      const result = gatewayModuleMockMapBroker({ rootDir: '/repo/packages/@gateway/npm' });

      expect(result).toStrictEqual({});
    });
  });

  describe('no npm gateway above rootDir', () => {
    it('EMPTY: {rootDir outside any repo} => returns no mapping', () => {
      const proxy = gatewayModuleMockMapBrokerProxy();
      proxy.setupNoNpmGateway({ rootDir: '/tmp/lonely' });

      const result = gatewayModuleMockMapBroker({ rootDir: '/tmp/lonely' });

      expect(result).toStrictEqual({});
    });
  });
});
