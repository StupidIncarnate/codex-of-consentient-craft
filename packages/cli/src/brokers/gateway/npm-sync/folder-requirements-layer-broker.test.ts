import { installTestbedCreateBroker } from '@dungeonmaster/testing';
import { folderRequirementsLayerBroker } from './folder-requirements-layer-broker';
import { folderRequirementsLayerBrokerProxy } from './folder-requirements-layer-broker.proxy';

const OWN_SRC_ROOT = '/own/npm/src';

describe('folderRequirementsLayerBroker', () => {
  it('VALID: {imports its own package, a builtin, a node: builtin, dungeonmaster testing, a node gateway path and itself} => returns []', async () => {
    const proxy = folderRequirementsLayerBrokerProxy();
    proxy.setupFolder({
      ownSrcRoot: OWN_SRC_ROOT,
      folder: 'elkjs',
      files: {
        'elkjs.ts': "export * from 'elkjs';\n",
        'elkjs.proxy.ts': [
          "import { registerMock } from '@dungeonmaster/testing/register-mock';",
          "import { readFile } from 'fs/promises';",
          "import { join } from 'node:path';",
          "import { FsErrorStub } from '#gateway/node/fs/is-fs-error/fs-error.stub';",
          "import { elk } from '#gateway/npm/elkjs';",
          "import { helper } from './helper/helper';",
        ].join('\n'),
        'README.md': "import nothing from 'never-read';\n",
      },
    });

    const result = await folderRequirementsLayerBroker({
      repoRoot: '/repo',
      ownSrcRoot: OWN_SRC_ROOT,
      folder: 'elkjs',
      resolvableNames: ['elkjs'],
      knownFolders: [],
    });

    expect(result).toStrictEqual([]);
  });

  it('VALID: {a subpath import of a declared package, and #gateway/npm/<other> the consumer will have} => returns []', async () => {
    const proxy = folderRequirementsLayerBrokerProxy();
    proxy.setupFolder({
      ownSrcRoot: OWN_SRC_ROOT,
      folder: 'jest__globals',
      files: {
        'jest__globals.ts':
          "export * from '@jest/globals/build/index.js';\nimport { fn } from '#gateway/npm/jest-mock';\n",
      },
    });

    const result = await folderRequirementsLayerBroker({
      repoRoot: '/repo',
      ownSrcRoot: OWN_SRC_ROOT,
      folder: 'jest__globals',
      resolvableNames: ['@jest/globals'],
      knownFolders: ['jest-mock'],
    });

    expect(result).toStrictEqual([]);
  });

  it('VALID: {a relative import into gateway-test-support} => returns it as an extra folder', async () => {
    const proxy = folderRequirementsLayerBrokerProxy();
    proxy.setupFolder({
      ownSrcRoot: OWN_SRC_ROOT,
      folder: 'typescript-eslint__utils',
      files: {
        'identifier/identifier.stub.ts':
          "import { parseAndFindNode } from '../../gateway-test-support/parse-and-find-node';\nexport const code = \"import a from 'x';\";\n",
      },
    });

    const result = await folderRequirementsLayerBroker({
      repoRoot: '/repo',
      ownSrcRoot: OWN_SRC_ROOT,
      folder: 'typescript-eslint__utils',
      resolvableNames: [],
      knownFolders: [],
    });

    expect(result).toStrictEqual(['gateway-test-support']);
  });

  it('VALID: {a relative import into a folder the consumer has} => returns []', async () => {
    const proxy = folderRequirementsLayerBrokerProxy();
    proxy.setupFolder({
      ownSrcRoot: OWN_SRC_ROOT,
      folder: 'hono__ws',
      files: { 'hono__ws.ts': "import { app } from '../hono/hono-app/hono-app.stub';\n" },
    });

    const result = await folderRequirementsLayerBroker({
      repoRoot: '/repo',
      ownSrcRoot: OWN_SRC_ROOT,
      folder: 'hono__ws',
      resolvableNames: [],
      knownFolders: ['hono'],
    });

    expect(result).toStrictEqual([]);
  });

  it('INVALID: {a raw import of a package the consumer does not declare} => returns unresolved-import', async () => {
    const proxy = folderRequirementsLayerBrokerProxy();
    proxy.setupFolder({
      ownSrcRoot: OWN_SRC_ROOT,
      folder: 'hono__node-ws',
      files: {
        'hono__node-ws.ts': "export * from '@hono/node-ws';\nimport type { Hono } from 'hono';\n",
      },
    });

    const result = await folderRequirementsLayerBroker({
      repoRoot: '/repo',
      ownSrcRoot: OWN_SRC_ROOT,
      folder: 'hono__node-ws',
      resolvableNames: ['@hono/node-ws'],
      knownFolders: [],
    });

    expect(result).toBe('unresolved-import');
  });

  it('INVALID: {#gateway/npm/<other> the consumer will not have} => returns unresolved-import', async () => {
    const proxy = folderRequirementsLayerBrokerProxy();
    proxy.setupFolder({
      ownSrcRoot: OWN_SRC_ROOT,
      folder: 'jest__globals',
      files: { 'jest__globals.ts': "import { fn } from '#gateway/npm/jest-mock';\n" },
    });

    const result = await folderRequirementsLayerBroker({
      repoRoot: '/repo',
      ownSrcRoot: OWN_SRC_ROOT,
      folder: 'jest__globals',
      resolvableNames: [],
      knownFolders: [],
    });

    expect(result).toBe('unresolved-import');
  });

  it('INVALID: {a relative import into a folder the consumer will not have} => returns unresolved-import', async () => {
    const proxy = folderRequirementsLayerBrokerProxy();
    proxy.setupFolder({
      ownSrcRoot: OWN_SRC_ROOT,
      folder: 'hono__ws',
      files: { 'hono__ws.ts': "import { app } from '../hono/hono-app/hono-app.stub';\n" },
    });

    const result = await folderRequirementsLayerBroker({
      repoRoot: '/repo',
      ownSrcRoot: OWN_SRC_ROOT,
      folder: 'hono__ws',
      resolvableNames: [],
      knownFolders: [],
    });

    expect(result).toBe('unresolved-import');
  });

  it('INVALID: {a declared package that is ESM-only for the CommonJS gateway} => returns esm-only', async () => {
    const proxy = folderRequirementsLayerBrokerProxy();
    const testbed = installTestbedCreateBroker({ baseName: 'folder-requirements-esm' });
    testbed.writeFile({
      relativePath: 'packages/@gateway/npm/package.json',
      content: JSON.stringify({ name: '@acme/npm', version: '0.1.0' }),
    });
    testbed.writeFile({
      relativePath: 'node_modules/esm-lib/package.json',
      content: JSON.stringify({
        name: 'esm-lib',
        version: '1.0.0',
        type: 'module',
        exports: { '.': { types: './index.d.ts', default: './index.js' } },
      }),
    });
    testbed.writeFile({
      relativePath: 'node_modules/esm-lib/index.d.ts',
      content: 'export declare const value: number;\n',
    });
    proxy.setupFolder({
      ownSrcRoot: OWN_SRC_ROOT,
      folder: 'esm-lib',
      files: { 'esm-lib.ts': "export * from 'esm-lib';\nimport { value } from 'esm-lib';\n" },
    });

    const result = await folderRequirementsLayerBroker({
      repoRoot: testbed.guildPath,
      ownSrcRoot: OWN_SRC_ROOT,
      folder: 'esm-lib',
      resolvableNames: ['esm-lib'],
      knownFolders: [],
    });
    testbed.cleanup();

    expect(result).toBe('esm-only');
  });
});
