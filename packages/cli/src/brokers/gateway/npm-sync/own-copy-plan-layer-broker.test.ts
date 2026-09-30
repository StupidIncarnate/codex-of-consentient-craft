import { GatewayNpmDependencyStub } from '../../../contracts/gateway-npm-dependency/gateway-npm-dependency.stub';
import { ownCopyPlanLayerBroker } from './own-copy-plan-layer-broker';
import { ownCopyPlanLayerBrokerProxy } from './own-copy-plan-layer-broker.proxy';

const OWN_SRC_ROOT = '/own/npm/src';

describe('ownCopyPlanLayerBroker', () => {
  it('VALID: {hono, with subpath folders of hono and of @hono/node-server} => copies hono and only the subpaths of hono that resolve', async () => {
    const proxy = ownCopyPlanLayerBrokerProxy();
    proxy.setupOwnGateway({
      ownSrcRoot: OWN_SRC_ROOT,
      folders: {
        hono: { 'hono.ts': "export * from 'hono';\n" },
        'hono__utils__http-status': {
          'hono__utils__http-status.ts': "export type * from 'hono/utils/http-status';\n",
        },
        'hono__node-server': {
          'hono__node-server.ts':
            "export * from '@hono/node-server';\nimport type { Hono } from 'hono';\n",
        },
        hono__ws: { 'hono__ws.ts': "export * from 'hono/ws';\nimport { ws } from 'ws-missing';\n" },
      },
    });

    const result = await ownCopyPlanLayerBroker({
      repoRoot: '/repo',
      ownSrcRoot: OWN_SRC_ROOT,
      dependency: GatewayNpmDependencyStub({ name: 'hono', range: '^4.0.0', folder: 'hono' }),
      resolvableNames: ['hono'],
      knownFolders: ['hono'],
      consumerFolders: [],
    });

    expect(result).toStrictEqual(['hono', 'hono__utils__http-status']);
  });

  it('VALID: {a subpath folder the consumer already has} => leaves it out', async () => {
    const proxy = ownCopyPlanLayerBrokerProxy();
    proxy.setupOwnGateway({
      ownSrcRoot: OWN_SRC_ROOT,
      folders: {
        hono: { 'hono.ts': "export * from 'hono';\n" },
        'hono__utils__http-status': {
          'hono__utils__http-status.ts': "export type * from 'hono/utils/http-status';\n",
        },
      },
    });

    const result = await ownCopyPlanLayerBroker({
      repoRoot: '/repo',
      ownSrcRoot: OWN_SRC_ROOT,
      dependency: GatewayNpmDependencyStub({ name: 'hono', range: '^4.0.0', folder: 'hono' }),
      resolvableNames: ['hono'],
      knownFolders: ['hono'],
      consumerFolders: ['hono__utils__http-status'],
    });

    expect(result).toStrictEqual(['hono']);
  });

  it('VALID: {a folder importing gateway-test-support, which resolves} => copies test support too', async () => {
    const proxy = ownCopyPlanLayerBrokerProxy();
    proxy.setupOwnGateway({
      ownSrcRoot: OWN_SRC_ROOT,
      folders: {
        'typescript-eslint__utils': {
          'typescript-eslint__utils.ts': "export * from '@typescript-eslint/utils';\n",
          'identifier/identifier.stub.ts':
            "import { parseAndFindNode } from '../../gateway-test-support/parse-and-find-node';\n",
        },
        'gateway-test-support': {
          'parse-and-find-node.ts':
            "import { parse } from '@typescript-eslint/typescript-estree';\n",
        },
      },
    });

    const result = await ownCopyPlanLayerBroker({
      repoRoot: '/repo',
      ownSrcRoot: OWN_SRC_ROOT,
      dependency: GatewayNpmDependencyStub({
        name: '@typescript-eslint/utils',
        range: '^8.0.0',
        folder: 'typescript-eslint__utils',
      }),
      resolvableNames: ['@typescript-eslint/utils', '@typescript-eslint/typescript-estree'],
      knownFolders: ['typescript-eslint__utils'],
      consumerFolders: [],
    });

    expect(result).toStrictEqual(['typescript-eslint__utils', 'gateway-test-support']);
  });

  it('VALID: {test support needed but the consumer already has it} => copies only the folder', async () => {
    const proxy = ownCopyPlanLayerBrokerProxy();
    proxy.setupOwnGateway({
      ownSrcRoot: OWN_SRC_ROOT,
      folders: {
        'typescript-eslint__utils': {
          'typescript-eslint__utils.ts':
            "export * from '@typescript-eslint/utils';\nimport { p } from '../gateway-test-support/parse-and-find-node';\n",
        },
      },
    });

    const result = await ownCopyPlanLayerBroker({
      repoRoot: '/repo',
      ownSrcRoot: OWN_SRC_ROOT,
      dependency: GatewayNpmDependencyStub({
        name: '@typescript-eslint/utils',
        range: '^8.0.0',
        folder: 'typescript-eslint__utils',
      }),
      resolvableNames: ['@typescript-eslint/utils'],
      knownFolders: ['typescript-eslint__utils'],
      consumerFolders: ['gateway-test-support'],
    });

    expect(result).toStrictEqual(['typescript-eslint__utils']);
  });

  it('INVALID: {test support needed, but its own imports do not resolve} => returns null', async () => {
    const proxy = ownCopyPlanLayerBrokerProxy();
    proxy.setupOwnGateway({
      ownSrcRoot: OWN_SRC_ROOT,
      folders: {
        'typescript-eslint__utils': {
          'typescript-eslint__utils.ts':
            "export * from '@typescript-eslint/utils';\nimport { p } from '../gateway-test-support/parse-and-find-node';\n",
        },
        'gateway-test-support': {
          'parse-and-find-node.ts':
            "import { parse } from '@typescript-eslint/typescript-estree';\n",
        },
      },
    });

    const result = await ownCopyPlanLayerBroker({
      repoRoot: '/repo',
      ownSrcRoot: OWN_SRC_ROOT,
      dependency: GatewayNpmDependencyStub({
        name: '@typescript-eslint/utils',
        range: '^8.0.0',
        folder: 'typescript-eslint__utils',
      }),
      resolvableNames: ['@typescript-eslint/utils'],
      knownFolders: ['typescript-eslint__utils'],
      consumerFolders: [],
    });

    expect(result).toBe(null);
  });

  it('INVALID: {the folder imports a package the consumer lacks} => returns null', async () => {
    const proxy = ownCopyPlanLayerBrokerProxy();
    proxy.setupOwnGateway({
      ownSrcRoot: OWN_SRC_ROOT,
      folders: {
        'hono__node-server': {
          'hono__node-server.ts':
            "export * from '@hono/node-server';\nimport type { Hono } from 'hono';\n",
        },
      },
    });

    const result = await ownCopyPlanLayerBroker({
      repoRoot: '/repo',
      ownSrcRoot: OWN_SRC_ROOT,
      dependency: GatewayNpmDependencyStub({
        name: '@hono/node-server',
        range: '^1.0.0',
        folder: 'hono__node-server',
      }),
      resolvableNames: ['@hono/node-server'],
      knownFolders: ['hono__node-server'],
      consumerFolders: [],
    });

    expect(result).toBe(null);
  });

  it('VALID: {we have only subpath folders for the package} => copies the subpath folders that resolve', async () => {
    const proxy = ownCopyPlanLayerBrokerProxy();
    proxy.setupOwnGateway({
      ownSrcRoot: OWN_SRC_ROOT,
      folders: {
        modelcontextprotocol__sdk__server: {
          'modelcontextprotocol__sdk__server.ts':
            "export * from '@modelcontextprotocol/sdk/server';\n",
        },
        modelcontextprotocol__sdk__types: {
          'modelcontextprotocol__sdk__types.ts':
            "export * from '@modelcontextprotocol/sdk/types.js';\nimport { z } from 'zod';\n",
        },
      },
    });

    const result = await ownCopyPlanLayerBroker({
      repoRoot: '/repo',
      ownSrcRoot: OWN_SRC_ROOT,
      dependency: GatewayNpmDependencyStub({
        name: '@modelcontextprotocol/sdk',
        range: '^1.0.0',
        folder: 'modelcontextprotocol__sdk',
      }),
      resolvableNames: ['@modelcontextprotocol/sdk'],
      knownFolders: ['modelcontextprotocol__sdk'],
      consumerFolders: [],
    });

    expect(result).toStrictEqual(['modelcontextprotocol__sdk__server']);
  });

  it('INVALID: {we have only subpath folders, and none resolves} => returns null', async () => {
    const proxy = ownCopyPlanLayerBrokerProxy();
    proxy.setupOwnGateway({
      ownSrcRoot: OWN_SRC_ROOT,
      folders: {
        modelcontextprotocol__sdk__types: {
          'modelcontextprotocol__sdk__types.ts':
            "export * from '@modelcontextprotocol/sdk/types.js';\nimport { z } from 'zod';\n",
        },
      },
    });

    const result = await ownCopyPlanLayerBroker({
      repoRoot: '/repo',
      ownSrcRoot: OWN_SRC_ROOT,
      dependency: GatewayNpmDependencyStub({
        name: '@modelcontextprotocol/sdk',
        range: '^1.0.0',
        folder: 'modelcontextprotocol__sdk',
      }),
      resolvableNames: ['@modelcontextprotocol/sdk'],
      knownFolders: ['modelcontextprotocol__sdk'],
      consumerFolders: [],
    });

    expect(result).toBe(null);
  });

  it('EMPTY: {no folder of ours for the package} => returns null', async () => {
    const proxy = ownCopyPlanLayerBrokerProxy();
    proxy.setupOwnGateway({
      ownSrcRoot: OWN_SRC_ROOT,
      folders: { zod: { 'zod.ts': "export * from 'zod';\n" } },
    });

    const result = await ownCopyPlanLayerBroker({
      repoRoot: '/repo',
      ownSrcRoot: OWN_SRC_ROOT,
      dependency: GatewayNpmDependencyStub(),
      resolvableNames: ['left-pad'],
      knownFolders: ['left-pad'],
      consumerFolders: [],
    });

    expect(result).toBe(null);
  });

  it('EDGE: {a subpath-named folder with no barrel} => is not treated as a subpath of the package', async () => {
    const proxy = ownCopyPlanLayerBrokerProxy();
    proxy.setupOwnGateway({
      ownSrcRoot: OWN_SRC_ROOT,
      folders: {
        zod: { 'zod.ts': "export * from 'zod';\n" },
        zod__stray: { 'notes.ts': 'export {};\n' },
      },
    });

    const result = await ownCopyPlanLayerBroker({
      repoRoot: '/repo',
      ownSrcRoot: OWN_SRC_ROOT,
      dependency: GatewayNpmDependencyStub({ name: 'zod', range: '^4.0.0', folder: 'zod' }),
      resolvableNames: ['zod'],
      knownFolders: ['zod'],
      consumerFolders: [],
    });

    expect(result).toStrictEqual(['zod']);
  });
});
