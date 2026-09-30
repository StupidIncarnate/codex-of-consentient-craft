import { installTestbedCreateBroker } from '@dungeonmaster/testing';
import { gatewayNpmSyncBroker } from './gateway-npm-sync-broker';
import { npmCommandFakeHarness } from '../../../../test/harnesses/npm-command-fake/npm-command-fake.harness';
import { npmGatewaySyncHarness } from '../../../../test/harnesses/npm-gateway-sync/npm-gateway-sync.harness';

const PLACEHOLDER = 'export {};\n';

describe('gatewayNpmSyncBroker (integration)', () => {
  const npmFake = npmCommandFakeHarness();
  const sync = npmGatewaySyncHarness();

  describe('a package dungeonmaster wraps', () => {
    it('VALID: {root depends on elkjs} => copies our elkjs folder byte for byte, records it and drops the placeholder', async () => {
      npmFake.stageSucceeds();
      const testbed = installTestbedCreateBroker({ baseName: 'npm-sync-copy' });
      testbed.writeFile({
        relativePath: 'package.json',
        content: JSON.stringify({ name: 'acme', dependencies: { elkjs: '^0.11.0' } }),
      });
      testbed.writeFile({
        relativePath: 'packages/@gateway/npm/package.json',
        content: JSON.stringify({ name: '@acme/npm', version: '0.1.0' }),
      });
      testbed.writeFile({
        relativePath: 'packages/@gateway/npm/src/index.d.ts',
        content: PLACEHOLDER,
      });

      const result = await gatewayNpmSyncBroker({ repoRoot: testbed.guildPath });

      const barrel = testbed.readFile({ relativePath: 'packages/@gateway/npm/src/elkjs/elkjs.ts' });
      const stub = testbed.readFile({
        relativePath: 'packages/@gateway/npm/src/elkjs/elk-layout-result/elk-layout-result.stub.ts',
      });
      const gatewayPackageJson = testbed.readFile({
        relativePath: 'packages/@gateway/npm/package.json',
      });
      const placeholder = testbed.readFile({
        relativePath: 'packages/@gateway/npm/src/index.d.ts',
      });
      testbed.cleanup();

      expect(result).toStrictEqual({ copied: ['elkjs'], generated: [], untyped: [], esmOnly: [] });
      expect(barrel).toBe(sync.readOwnGatewayFile({ relativePath: 'elkjs/elkjs.ts' }));
      expect(stub).toBe(
        sync.readOwnGatewayFile({
          relativePath: 'elkjs/elk-layout-result/elk-layout-result.stub.ts',
        }),
      );
      expect(gatewayPackageJson).toBe(
        `${JSON.stringify(
          { name: '@acme/npm', version: '0.1.0', dependencies: { elkjs: '^0.11.0' } },
          null,
          2,
        )}\n`,
      );
      expect(placeholder).toBe(null);
    });
  });

  describe('a package dungeonmaster does not wrap', () => {
    it('VALID: {workspace depends on left-pad, typed with export =} => writes an import-equals passthrough and its test', async () => {
      npmFake.stageSucceeds();
      const testbed = installTestbedCreateBroker({ baseName: 'npm-sync-passthrough' });
      testbed.writeFile({
        relativePath: 'package.json',
        content: JSON.stringify({ name: 'acme' }),
      });
      testbed.writeFile({
        relativePath: 'packages/app/package.json',
        content: JSON.stringify({ name: '@acme/app', dependencies: { 'left-pad': '^1.3.0' } }),
      });
      testbed.writeFile({
        relativePath: 'packages/@gateway/npm/package.json',
        content: JSON.stringify({ name: '@acme/npm', version: '0.1.0' }),
      });
      testbed.writeFile({
        relativePath: 'node_modules/left-pad/package.json',
        content: JSON.stringify({
          name: 'left-pad',
          version: '1.3.0',
          main: 'index.js',
          types: 'index.d.ts',
        }),
      });
      testbed.writeFile({
        relativePath: 'node_modules/left-pad/index.js',
        content: "module.exports = (text, length) => text.padStart(length, ' ');\n",
      });
      testbed.writeFile({
        relativePath: 'node_modules/left-pad/index.d.ts',
        content:
          'declare function leftPad(text: string, length: number): string;\nexport = leftPad;\n',
      });

      const result = await gatewayNpmSyncBroker({ repoRoot: testbed.guildPath });

      const barrel = testbed.readFile({
        relativePath: 'packages/@gateway/npm/src/left-pad/left-pad.ts',
      });
      const barrelTest = testbed.readFile({
        relativePath: 'packages/@gateway/npm/src/left-pad/left-pad.test.ts',
      });
      const diagnostics = sync.compileDiagnostics({
        repoRoot: testbed.guildPath,
        relativePaths: [
          'packages/@gateway/npm/src/left-pad/left-pad.ts',
          'packages/@gateway/npm/src/left-pad/left-pad.test.ts',
        ],
      });
      const testRun = await sync.runWrittenTests({
        repoRoot: testbed.guildPath,
        relativeDir: 'packages/@gateway/npm/src/left-pad',
      });
      const gatewayPackageJson = testbed.readFile({
        relativePath: 'packages/@gateway/npm/package.json',
      });
      testbed.cleanup();

      expect(result).toStrictEqual({
        copied: [],
        generated: ['left-pad'],
        untyped: [],
        esmOnly: [],
      });
      expect({ diagnostics, testRun }).toStrictEqual({
        diagnostics: [],
        testRun: 'exit 0; Tests: 1 passed, 1 total',
      });
      expect(barrel).toBe(`/**
 * PURPOSE: Pass-through for the npm package 'left-pad'. Code outside the gateway imports left-pad
 * through here instead of the raw package, so a future guard or override on left-pad lands in
 * this one file and reaches every caller.
 *
 * USAGE:
 * import pkg from '#gateway/npm/left-pad';
 */

import pkgModule = require('left-pad');

export = pkgModule;
`);
      expect(barrelTest).toBe(`import ourModule = require('./left-pad');
// A raw \`require\`, not \`import * as\`: TS's importStar helper synthesizes a .default onto any
// CJS module that lacks __esModule, which is every third-party package here — comparing
// against that synthetic shape would fail every pass-through. \`import x = require(...)\` compiles
// straight to \`require(...)\`, so pkgModule is the package's own real runtime shape.
import pkgModule = require('left-pad');

describe('#gateway/npm/left-pad', () => {
  it('VALID: {module} => is the same module object as left-pad', () => {
    expect(ourModule).toBe(pkgModule);
  });
});
`);
      expect(gatewayPackageJson).toBe(
        `${JSON.stringify(
          { name: '@acme/npm', version: '0.1.0', dependencies: { 'left-pad': '^1.3.0' } },
          null,
          2,
        )}\n`,
      );
    });

    it('VALID: {types declare a default, the runtime module has none} => writes no default line and its test passes', async () => {
      npmFake.stageSucceeds();
      const testbed = installTestbedCreateBroker({ baseName: 'npm-sync-runtime-no-default' });
      testbed.writeFile({
        relativePath: 'package.json',
        content: JSON.stringify({ name: 'acme', dependencies: { 'agent-lib': '^7.0.0' } }),
      });
      testbed.writeFile({
        relativePath: 'packages/@gateway/npm/package.json',
        content: JSON.stringify({ name: '@acme/npm', version: '0.1.0' }),
      });
      testbed.writeFile({
        relativePath: 'node_modules/agent-lib/package.json',
        content: JSON.stringify({
          name: 'agent-lib',
          version: '7.0.0',
          main: 'index.js',
          types: 'index.d.ts',
        }),
      });
      testbed.writeFile({
        relativePath: 'node_modules/agent-lib/index.d.ts',
        content:
          'export declare const request: () => number;\ndeclare const lib: { request: () => number };\nexport default lib;\n',
      });
      testbed.writeFile({
        relativePath: 'node_modules/agent-lib/index.js',
        content: 'exports.request = () => 1;\n',
      });

      const result = await gatewayNpmSyncBroker({ repoRoot: testbed.guildPath });

      const barrel = testbed.readFile({
        relativePath: 'packages/@gateway/npm/src/agent-lib/agent-lib.ts',
      });
      const diagnostics = sync.compileDiagnostics({
        repoRoot: testbed.guildPath,
        relativePaths: [
          'packages/@gateway/npm/src/agent-lib/agent-lib.ts',
          'packages/@gateway/npm/src/agent-lib/agent-lib.test.ts',
        ],
      });
      const testRun = await sync.runWrittenTests({
        repoRoot: testbed.guildPath,
        relativeDir: 'packages/@gateway/npm/src/agent-lib',
      });
      testbed.cleanup();

      expect(result).toStrictEqual({
        copied: [],
        generated: ['agent-lib'],
        untyped: [],
        esmOnly: [],
      });
      expect(barrel).toBe(`/**
 * PURPOSE: Pass-through for the npm package 'agent-lib'. Code outside the gateway imports agent-lib
 * through here instead of the raw package, so a future guard or override on agent-lib lands in
 * this one file and reaches every caller.
 *
 * USAGE:
 * import { someExport } from '#gateway/npm/agent-lib';
 */

export * from 'agent-lib';
`);
      expect({ diagnostics, testRun }).toStrictEqual({
        diagnostics: [],
        testRun: 'exit 0; Tests: 1 passed, 1 total',
      });
    });

    it('VALID: {our folder imports a package the consumer lacks} => falls back to a passthrough', async () => {
      npmFake.stageSucceeds();
      const testbed = installTestbedCreateBroker({ baseName: 'npm-sync-fallback' });
      testbed.writeFile({
        relativePath: 'package.json',
        content: JSON.stringify({ name: 'acme', dependencies: { '@hono/node-ws': '^1.0.0' } }),
      });
      testbed.writeFile({
        relativePath: 'packages/@gateway/npm/package.json',
        content: JSON.stringify({ name: '@acme/npm', version: '0.1.0' }),
      });

      const result = await gatewayNpmSyncBroker({ repoRoot: testbed.guildPath });

      const barrel = testbed.readFile({
        relativePath: 'packages/@gateway/npm/src/hono__node-ws/hono__node-ws.ts',
      });
      const ourWrapper = testbed.readFile({
        relativePath: 'packages/@gateway/npm/src/hono__node-ws/node-web-socket/node-web-socket.ts',
      });
      testbed.cleanup();

      expect(result).toStrictEqual({
        copied: [],
        generated: ['hono__node-ws'],
        untyped: ['@hono/node-ws'],
        esmOnly: [],
      });
      expect(barrel).toBe(`/**
 * PURPOSE: Pass-through for the npm package '@hono/node-ws'. Code outside the gateway imports @hono/node-ws
 * through here instead of the raw package, so a future guard or override on @hono/node-ws lands in
 * this one file and reaches every caller.
 *
 * '@hono/node-ws' resolved no type declarations when this file was generated, so every import
 * through here is untyped until the package or an @types package supplies them.
 *
 * USAGE:
 * import { someExport } from '#gateway/npm/hono__node-ws';
 */

export * from '@hono/node-ws';
`);
      expect(ourWrapper).toBe(null);
    });
  });

  describe('a folder the consumer already has', () => {
    it('VALID: {elkjs folder hand-edited} => leaves it byte-identical and the gateway package.json untouched', async () => {
      npmFake.stageSucceeds();
      const testbed = installTestbedCreateBroker({ baseName: 'npm-sync-existing' });
      const gatewayPackageJson = JSON.stringify({ name: '@acme/npm', version: '0.1.0' });
      testbed.writeFile({
        relativePath: 'package.json',
        content: JSON.stringify({ name: 'acme', dependencies: { elkjs: '^0.11.0' } }),
      });
      testbed.writeFile({
        relativePath: 'packages/@gateway/npm/package.json',
        content: gatewayPackageJson,
      });
      testbed.writeFile({
        relativePath: 'packages/@gateway/npm/src/elkjs/elkjs.ts',
        content: "// hand-edited\nexport * from 'elkjs';\n",
      });

      const result = await gatewayNpmSyncBroker({ repoRoot: testbed.guildPath });

      const barrel = testbed.readFile({ relativePath: 'packages/@gateway/npm/src/elkjs/elkjs.ts' });
      const stub = testbed.readFile({
        relativePath: 'packages/@gateway/npm/src/elkjs/elk-layout-result/elk-layout-result.stub.ts',
      });
      const packageJsonAfter = testbed.readFile({
        relativePath: 'packages/@gateway/npm/package.json',
      });
      testbed.cleanup();

      expect(result).toStrictEqual({ copied: [], generated: [], untyped: [], esmOnly: [] });
      expect(barrel).toBe("// hand-edited\nexport * from 'elkjs';\n");
      expect(stub).toBe(null);
      expect(packageJsonAfter).toBe(gatewayPackageJson);
    });
  });

  describe('dependencies that never get a folder', () => {
    it('VALID: {@types/*, dungeonmaster, @dungeonmaster/*, a workspace package} => writes nothing', async () => {
      npmFake.stageSucceeds();
      const testbed = installTestbedCreateBroker({ baseName: 'npm-sync-skipped' });
      const gatewayPackageJson = JSON.stringify({ name: '@acme/npm', version: '0.1.0' });
      testbed.writeFile({
        relativePath: 'package.json',
        content: JSON.stringify({
          name: 'acme',
          dependencies: {
            '@types/node': '^24.0.0',
            dungeonmaster: '^0.1.0',
            '@dungeonmaster/testing': '^0.1.0',
            '@acme/app': '*',
          },
        }),
      });
      testbed.writeFile({
        relativePath: 'packages/app/package.json',
        content: JSON.stringify({ name: '@acme/app', dependencies: { '@acme/npm': '*' } }),
      });
      testbed.writeFile({
        relativePath: 'packages/@gateway/npm/package.json',
        content: gatewayPackageJson,
      });
      testbed.writeFile({
        relativePath: 'packages/@gateway/npm/src/index.d.ts',
        content: PLACEHOLDER,
      });

      const result = await gatewayNpmSyncBroker({ repoRoot: testbed.guildPath });

      const packageJsonAfter = testbed.readFile({
        relativePath: 'packages/@gateway/npm/package.json',
      });
      const placeholder = testbed.readFile({
        relativePath: 'packages/@gateway/npm/src/index.d.ts',
      });
      const typesNode = testbed.readFile({
        relativePath: 'packages/@gateway/npm/src/types__node/types__node.ts',
      });
      testbed.cleanup();

      expect(result).toStrictEqual({ copied: [], generated: [], untyped: [], esmOnly: [] });
      expect(packageJsonAfter).toBe(gatewayPackageJson);
      expect(placeholder).toBe(PLACEHOLDER);
      expect(typesNode).toBe(null);
    });
  });

  describe('a package a subpath folder already covers', () => {
    it('VALID: {consumer has react-dom__client, depends on react-dom} => writes nothing for react-dom', async () => {
      npmFake.stageSucceeds();
      const testbed = installTestbedCreateBroker({ baseName: 'npm-sync-covered' });
      const gatewayPackageJson = JSON.stringify({
        name: '@acme/npm',
        version: '0.1.0',
        dependencies: { 'react-dom': '^19.0.0' },
      });
      testbed.writeFile({
        relativePath: 'package.json',
        content: JSON.stringify({ name: 'acme', dependencies: { 'react-dom': '^19.0.0' } }),
      });
      testbed.writeFile({
        relativePath: 'packages/@gateway/npm/package.json',
        content: gatewayPackageJson,
      });
      testbed.writeFile({
        relativePath: 'packages/@gateway/npm/src/react-dom__client/react-dom__client.ts',
        content: "export * from 'react-dom/client';\n",
      });

      const result = await gatewayNpmSyncBroker({ repoRoot: testbed.guildPath });

      const rootBarrel = testbed.readFile({
        relativePath: 'packages/@gateway/npm/src/react-dom/react-dom.ts',
      });
      const packageJsonAfter = testbed.readFile({
        relativePath: 'packages/@gateway/npm/package.json',
      });
      testbed.cleanup();

      expect(result).toStrictEqual({ copied: [], generated: [], untyped: [], esmOnly: [] });
      expect(rootBarrel).toBe(null);
      expect(packageJsonAfter).toBe(gatewayPackageJson);
    });
  });

  describe('a package dungeonmaster wraps only by subpath', () => {
    it('VALID: {depends on @modelcontextprotocol/sdk} => copies our subpath folders and writes no root passthrough', async () => {
      npmFake.stageSucceeds();
      const testbed = installTestbedCreateBroker({ baseName: 'npm-sync-subpath-only' });
      testbed.writeFile({
        relativePath: 'package.json',
        content: JSON.stringify({
          name: 'acme',
          dependencies: { '@modelcontextprotocol/sdk': '^1.0.0' },
        }),
      });
      testbed.writeFile({
        relativePath: 'packages/@gateway/npm/package.json',
        content: JSON.stringify({ name: '@acme/npm', version: '0.1.0' }),
      });

      const result = await gatewayNpmSyncBroker({ repoRoot: testbed.guildPath });

      const serverBarrel = testbed.readFile({
        relativePath:
          'packages/@gateway/npm/src/modelcontextprotocol__sdk__server/modelcontextprotocol__sdk__server.ts',
      });
      const rootBarrel = testbed.readFile({
        relativePath:
          'packages/@gateway/npm/src/modelcontextprotocol__sdk/modelcontextprotocol__sdk.ts',
      });
      const gatewayPackageJson = testbed.readFile({
        relativePath: 'packages/@gateway/npm/package.json',
      });
      testbed.cleanup();

      expect(result).toStrictEqual({
        copied: [
          'modelcontextprotocol__sdk__server',
          'modelcontextprotocol__sdk__server__mcp',
          'modelcontextprotocol__sdk__server__stdio',
          'modelcontextprotocol__sdk__types',
        ],
        generated: [],
        untyped: [],
        esmOnly: [],
      });
      expect(serverBarrel).toBe(
        sync.readOwnGatewayFile({
          relativePath: 'modelcontextprotocol__sdk__server/modelcontextprotocol__sdk__server.ts',
        }),
      );
      expect(rootBarrel).toBe(null);
      expect(gatewayPackageJson).toBe(
        `${JSON.stringify(
          {
            name: '@acme/npm',
            version: '0.1.0',
            dependencies: { '@modelcontextprotocol/sdk': '^1.0.0' },
          },
          null,
          2,
        )}\n`,
      );
    });

    it('VALID: {depends on react-dom only, our react-dom__client needs react} => falls back to a root passthrough', async () => {
      npmFake.stageSucceeds();
      const testbed = installTestbedCreateBroker({ baseName: 'npm-sync-subpath-fallback' });
      testbed.writeFile({
        relativePath: 'package.json',
        content: JSON.stringify({ name: 'acme', dependencies: { 'react-dom': '^19.0.0' } }),
      });
      testbed.writeFile({
        relativePath: 'packages/@gateway/npm/package.json',
        content: JSON.stringify({ name: '@acme/npm', version: '0.1.0' }),
      });

      const result = await gatewayNpmSyncBroker({ repoRoot: testbed.guildPath });

      const rootBarrel = testbed.readFile({
        relativePath: 'packages/@gateway/npm/src/react-dom/react-dom.ts',
      });
      const subpathBarrel = testbed.readFile({
        relativePath: 'packages/@gateway/npm/src/react-dom__client/react-dom__client.ts',
      });
      testbed.cleanup();

      expect(result).toStrictEqual({
        copied: [],
        generated: ['react-dom'],
        untyped: ['react-dom'],
        esmOnly: [],
      });
      expect(rootBarrel).toBe(`/**
 * PURPOSE: Pass-through for the npm package 'react-dom'. Code outside the gateway imports react-dom
 * through here instead of the raw package, so a future guard or override on react-dom lands in
 * this one file and reaches every caller.
 *
 * 'react-dom' resolved no type declarations when this file was generated, so every import
 * through here is untyped until the package or an @types package supplies them.
 *
 * USAGE:
 * import { someExport } from '#gateway/npm/react-dom';
 */

export * from 'react-dom';
`);
      expect(subpathBarrel).toBe(null);
    });
  });

  describe('an ESM-only package', () => {
    it('VALID: {depends on an ESM-only package} => writes a type-only passthrough and reports it esm-only', async () => {
      npmFake.stageSucceeds();
      const testbed = installTestbedCreateBroker({ baseName: 'npm-sync-esm-only' });
      testbed.writeFile({
        relativePath: 'package.json',
        content: JSON.stringify({ name: 'acme', dependencies: { 'esm-lib': '^1.0.0' } }),
      });
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

      const result = await gatewayNpmSyncBroker({ repoRoot: testbed.guildPath });

      const barrel = testbed.readFile({
        relativePath: 'packages/@gateway/npm/src/esm-lib/esm-lib.ts',
      });
      const diagnostics = sync.compileDiagnostics({
        repoRoot: testbed.guildPath,
        relativePaths: [
          'packages/@gateway/npm/src/esm-lib/esm-lib.ts',
          'packages/@gateway/npm/src/esm-lib/esm-lib.test.ts',
        ],
      });
      const testRun = await sync.runWrittenTests({
        repoRoot: testbed.guildPath,
        relativeDir: 'packages/@gateway/npm/src/esm-lib',
      });
      const gatewayPackageJson = testbed.readFile({
        relativePath: 'packages/@gateway/npm/package.json',
      });
      testbed.cleanup();

      expect(result).toStrictEqual({
        copied: [],
        generated: ['esm-lib'],
        untyped: [],
        esmOnly: ['esm-lib'],
      });
      expect({ diagnostics, testRun }).toStrictEqual({
        diagnostics: [],
        testRun: 'exit 0; Tests: 1 passed, 1 total',
      });
      expect(barrel).toBe(`/**
 * PURPOSE: Pass-through for the npm package 'esm-lib'. Code outside the gateway imports esm-lib
 * through here instead of the raw package, so a future guard or override on esm-lib lands in
 * this one file and reaches every caller.
 *
 * 'esm-lib' is ESM-only, and this CommonJS gateway package cannot \`require\` it, so this
 * re-exports its types only, resolved as an ES import (\`resolution-mode\`). A runtime value needs a
 * wrapper beside this barrel that loads the package with \`import()\`.
 *
 * USAGE:
 * import type { SomeType } from '#gateway/npm/esm-lib';
 */

export type * from 'esm-lib' with { 'resolution-mode': 'import' };
`);
      expect(gatewayPackageJson).toBe(
        `${JSON.stringify(
          { name: '@acme/npm', version: '0.1.0', dependencies: { 'esm-lib': '^1.0.0' } },
          null,
          2,
        )}\n`,
      );
    });

    it('VALID: {our elkjs wrapper, but the installed elkjs is ESM-only} => does not copy ours and writes a type-only passthrough', async () => {
      npmFake.stageSucceeds();
      const testbed = installTestbedCreateBroker({ baseName: 'npm-sync-esm-copy-fallback' });
      testbed.writeFile({
        relativePath: 'package.json',
        content: JSON.stringify({ name: 'acme', dependencies: { elkjs: '^0.11.0' } }),
      });
      testbed.writeFile({
        relativePath: 'packages/@gateway/npm/package.json',
        content: JSON.stringify({ name: '@acme/npm', version: '0.1.0' }),
      });
      testbed.writeFile({
        relativePath: 'node_modules/elkjs/package.json',
        content: JSON.stringify({
          name: 'elkjs',
          version: '0.11.0',
          type: 'module',
          exports: { '.': { types: './index.d.ts', default: './index.js' } },
        }),
      });
      testbed.writeFile({
        relativePath: 'node_modules/elkjs/index.d.ts',
        content: 'declare const ELK: unknown;\nexport default ELK;\n',
      });

      const result = await gatewayNpmSyncBroker({ repoRoot: testbed.guildPath });

      const barrel = testbed.readFile({ relativePath: 'packages/@gateway/npm/src/elkjs/elkjs.ts' });
      const ourStub = testbed.readFile({
        relativePath: 'packages/@gateway/npm/src/elkjs/elk-layout-result/elk-layout-result.stub.ts',
      });
      const diagnostics = sync.compileDiagnostics({
        repoRoot: testbed.guildPath,
        relativePaths: [
          'packages/@gateway/npm/src/elkjs/elkjs.ts',
          'packages/@gateway/npm/src/elkjs/elkjs.test.ts',
        ],
      });
      testbed.cleanup();

      expect(result).toStrictEqual({
        copied: [],
        generated: ['elkjs'],
        untyped: [],
        esmOnly: ['elkjs'],
      });
      expect(diagnostics).toStrictEqual([]);
      expect(barrel).toBe(`/**
 * PURPOSE: Pass-through for the npm package 'elkjs'. Code outside the gateway imports elkjs
 * through here instead of the raw package, so a future guard or override on elkjs lands in
 * this one file and reaches every caller.
 *
 * 'elkjs' is ESM-only, and this CommonJS gateway package cannot \`require\` it, so this
 * re-exports its types only, resolved as an ES import (\`resolution-mode\`). A runtime value needs a
 * wrapper beside this barrel that loads the package with \`import()\`.
 *
 * USAGE:
 * import type { SomeType } from '#gateway/npm/elkjs';
 */

export type * from 'elkjs' with { 'resolution-mode': 'import' };
`);
      expect(ourStub).toBe(null);
    });
  });

  describe('under npm ci', () => {
    it('VALID: {npm_command=ci, a missing folder} => reports it and writes nothing', async () => {
      npmFake.stageSucceeds();
      sync.stageNpmCi();
      const testbed = installTestbedCreateBroker({ baseName: 'npm-sync-ci' });
      const gatewayPackageJson = JSON.stringify({ name: '@acme/npm', version: '0.1.0' });
      testbed.writeFile({
        relativePath: 'package.json',
        content: JSON.stringify({
          name: 'acme',
          dependencies: { elkjs: '^0.11.0', 'left-pad': '^1.3.0' },
        }),
      });
      testbed.writeFile({
        relativePath: 'packages/@gateway/npm/package.json',
        content: gatewayPackageJson,
      });
      testbed.writeFile({
        relativePath: 'packages/@gateway/npm/src/index.d.ts',
        content: PLACEHOLDER,
      });

      const result = await gatewayNpmSyncBroker({ repoRoot: testbed.guildPath });

      const elkjsBarrel = testbed.readFile({
        relativePath: 'packages/@gateway/npm/src/elkjs/elkjs.ts',
      });
      const leftPadBarrel = testbed.readFile({
        relativePath: 'packages/@gateway/npm/src/left-pad/left-pad.ts',
      });
      const packageJsonAfter = testbed.readFile({
        relativePath: 'packages/@gateway/npm/package.json',
      });
      const placeholder = testbed.readFile({
        relativePath: 'packages/@gateway/npm/src/index.d.ts',
      });
      testbed.cleanup();

      expect(result).toStrictEqual({
        copied: ['elkjs'],
        generated: ['left-pad'],
        untyped: ['left-pad'],
        esmOnly: [],
      });
      expect(elkjsBarrel).toBe(null);
      expect(leftPadBarrel).toBe(null);
      expect(packageJsonAfter).toBe(gatewayPackageJson);
      expect(placeholder).toBe(PLACEHOLDER);
    });
  });
});
