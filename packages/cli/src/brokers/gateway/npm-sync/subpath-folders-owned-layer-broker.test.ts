import { GatewayNpmDependencyStub } from '../../../contracts/gateway-npm-dependency/gateway-npm-dependency.stub';
import { subpathFoldersOwnedLayerBroker } from './subpath-folders-owned-layer-broker';
import { subpathFoldersOwnedLayerBrokerProxy } from './subpath-folders-owned-layer-broker.proxy';

const SRC_ROOT = '/repo/packages/@gateway/npm/src';

describe('subpathFoldersOwnedLayerBroker', () => {
  it('VALID: {hono subpaths and a same-prefix folder of @hono/node-server} => returns only the subpaths of hono', async () => {
    const proxy = subpathFoldersOwnedLayerBrokerProxy();
    proxy.setupBarrels({
      srcRoot: SRC_ROOT,
      barrels: {
        'hono__utils__http-status': "export type * from 'hono/utils/http-status';\n",
        'hono__node-server':
          "export * from '@hono/node-server';\nimport type { Hono } from 'hono';\n",
      },
    });

    const result = await subpathFoldersOwnedLayerBroker({
      srcRoot: SRC_ROOT,
      dependency: GatewayNpmDependencyStub({ name: 'hono', range: '^4.0.0', folder: 'hono' }),
      candidateFolders: ['hono', 'zod', 'hono__utils__http-status', 'hono__node-server'],
    });

    expect(result).toStrictEqual(['hono__utils__http-status']);
  });

  it('VALID: {scoped package, a .js subpath import} => returns the folder that wraps it', async () => {
    const proxy = subpathFoldersOwnedLayerBrokerProxy();
    proxy.setupBarrels({
      srcRoot: SRC_ROOT,
      barrels: {
        modelcontextprotocol__sdk__server__mcp:
          "export * from '@modelcontextprotocol/sdk/server/mcp.js';\n",
      },
    });

    const result = await subpathFoldersOwnedLayerBroker({
      srcRoot: SRC_ROOT,
      dependency: GatewayNpmDependencyStub({
        name: '@modelcontextprotocol/sdk',
        range: '^1.0.0',
        folder: 'modelcontextprotocol__sdk',
      }),
      candidateFolders: ['modelcontextprotocol__sdk__server__mcp'],
    });

    expect(result).toStrictEqual(['modelcontextprotocol__sdk__server__mcp']);
  });

  it('EDGE: {a subpath-named folder with no barrel} => returns []', async () => {
    const proxy = subpathFoldersOwnedLayerBrokerProxy();
    proxy.setupBarrels({ srcRoot: SRC_ROOT, barrels: { zod__stray: null } });

    const result = await subpathFoldersOwnedLayerBroker({
      srcRoot: SRC_ROOT,
      dependency: GatewayNpmDependencyStub({ name: 'zod', range: '^4.0.0', folder: 'zod' }),
      candidateFolders: ['zod__stray'],
    });

    expect(result).toStrictEqual([]);
  });

  it('EMPTY: {no candidate starts with the folder} => returns []', async () => {
    subpathFoldersOwnedLayerBrokerProxy();

    const result = await subpathFoldersOwnedLayerBroker({
      srcRoot: SRC_ROOT,
      dependency: GatewayNpmDependencyStub(),
      candidateFolders: ['zod', 'left-padding'],
    });

    expect(result).toStrictEqual([]);
  });
});
