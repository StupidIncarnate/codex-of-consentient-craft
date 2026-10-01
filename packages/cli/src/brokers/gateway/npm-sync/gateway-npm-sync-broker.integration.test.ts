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
      sync.linkInstalledPackage({ repoRoot: testbed.guildPath, packageName: 'elkjs' });
      sync.linkInstalledPackage({ repoRoot: testbed.guildPath, packageName: '@types/jest' });

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

      expect(result).toStrictEqual({
        copied: ['elkjs'],
        generated: [],
        untyped: [],
        esmOnly: [],
        noRootExport: [],
        skippedOwnCopy: [],
      });
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
    it('VALID: {workspace depends on left-pad, typed with export =} => writes a named passthrough that a CommonJS and an ES-module consumer both compile, and its test', async () => {
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
        content:
          "module.exports = (text, length) => text.padStart(length, ' ');\nmodule.exports.version = '1.3.0';\n",
      });
      testbed.writeFile({
        relativePath: 'node_modules/left-pad/index.d.ts',
        content: [
          'declare function leftPad(text: string, length: number): string;',
          'declare namespace leftPad {',
          '  const version: string;',
          '  interface Options { fill: string }',
          '}',
          'export = leftPad;',
          '',
        ].join('\n'),
      });
      testbed.writeFile({
        relativePath: 'packages/app/src/consumer.ts',
        content: [
          "import leftPad, { version } from '../../@gateway/npm/src/left-pad/left-pad';",
          "import type { Options } from '../../@gateway/npm/src/left-pad/left-pad';",
          '',
          "export const options: Options = { fill: ' ' };",
          "export const padded: string = leftPad('a', 2) + version;",
          '',
        ].join('\n'),
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
      const esModuleDiagnostics = sync.compileDiagnostics({
        repoRoot: testbed.guildPath,
        relativePaths: ['packages/app/src/consumer.ts'],
        consumer: 'es-module',
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
        noRootExport: [],
        skippedOwnCopy: [],
      });
      expect({ diagnostics, esModuleDiagnostics, testRun }).toStrictEqual({
        diagnostics: [],
        esModuleDiagnostics: [],
        testRun: 'exit 0; Tests: 1 passed, 1 total',
      });
      expect(barrel).toBe(`/**
 * PURPOSE: Pass-through for the npm package 'left-pad'. Code outside the gateway imports left-pad
 * through here instead of the raw package, so a future guard or override on left-pad lands in
 * this one file and reaches every caller.
 *
 * 'left-pad' declares its module with \`export =\`, which no \`export *\` can re-export
 * (TS2498), so this names every export its declarations held when this file was generated. A
 * name the package adds later is reachable through the default export until it is added here.
 *
 * USAGE:
 * import pkg, { someExport } from '#gateway/npm/left-pad';
 */

export { default } from 'left-pad';
export {
  version,
} from 'left-pad';
export type {
  Options,
} from 'left-pad';
`);
      expect(barrelTest).toBe(`import * as ourModule from './left-pad';
// A raw \`require\`, not \`import * as\`: TS's importStar helper synthesizes a .default onto any
// CJS module that lacks __esModule, which is every third-party package here — comparing
// against that synthetic shape would fail every pass-through. \`import x = require(...)\` compiles
// straight to \`require(...)\`, so pkgModule is the package's own real runtime shape.
import pkgModule = require('left-pad');

describe('#gateway/npm/left-pad', () => {
  it('VALID: {module} => default is left-pad itself and each named value is its own binding', () => {
    expect({ ...ourModule }).toStrictEqual({
      default: pkgModule,
      version: pkgModule.version,
    });
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
        noRootExport: [],
        skippedOwnCopy: [],
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

    it('VALID: {our folder for a package the consumer has not installed} => falls back to a passthrough and reports the version skip', async () => {
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
        noRootExport: [],
        skippedOwnCopy: [
          {
            name: '@hono/node-ws',
            reason: 'version',
            ours: sync.ownGatewayRange({ packageName: '@hono/node-ws' }),
          },
        ],
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

      expect(result).toStrictEqual({
        copied: [],
        generated: [],
        untyped: [],
        esmOnly: [],
        noRootExport: [],
        skippedOwnCopy: [],
      });
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

      expect(result).toStrictEqual({
        copied: [],
        generated: [],
        untyped: [],
        esmOnly: [],
        noRootExport: [],
        skippedOwnCopy: [],
      });
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

      expect(result).toStrictEqual({
        copied: [],
        generated: [],
        untyped: [],
        esmOnly: [],
        noRootExport: [],
        skippedOwnCopy: [],
      });
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
      sync.linkInstalledPackage({
        repoRoot: testbed.guildPath,
        packageName: '@modelcontextprotocol/sdk',
      });
      sync.linkInstalledPackage({ repoRoot: testbed.guildPath, packageName: '@types/jest' });
      sync.linkInstalledPackage({
        repoRoot: testbed.guildPath,
        packageName: '@dungeonmaster/testing',
      });
      sync.linkInstalledPackage({ repoRoot: testbed.guildPath, packageName: '@types/node' });

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
        noRootExport: [],
        skippedOwnCopy: [],
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

    it('VALID: {depends on react-dom, not installed} => falls back to a root passthrough and reports the version skip', async () => {
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
        noRootExport: [],
        skippedOwnCopy: [
          {
            name: 'react-dom',
            reason: 'version',
            ours: sync.ownGatewayRange({ packageName: 'react-dom' }),
          },
        ],
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
        noRootExport: [],
        skippedOwnCopy: [],
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
          version: sync.minVersionSatisfying({
            range: sync.ownGatewayRange({ packageName: 'elkjs' }),
          }),
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
        noRootExport: [],
        skippedOwnCopy: [
          {
            name: 'elkjs',
            reason: 'esm-only',
            installed: sync.minVersionSatisfying({
              range: sync.ownGatewayRange({ packageName: 'elkjs' }),
            }),
            ours: sync.ownGatewayRange({ packageName: 'elkjs' }),
          },
        ],
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
      sync.linkInstalledPackage({ repoRoot: testbed.guildPath, packageName: 'elkjs' });
      sync.linkInstalledPackage({ repoRoot: testbed.guildPath, packageName: '@types/jest' });

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
        noRootExport: [],
        skippedOwnCopy: [],
      });
      expect(elkjsBarrel).toBe(null);
      expect(leftPadBarrel).toBe(null);
      expect(packageJsonAfter).toBe(gatewayPackageJson);
      expect(placeholder).toBe(PLACEHOLDER);
    });
  });

  describe('a package dungeonmaster wraps, at a version our wrapper was not built for', () => {
    it('VALID: {zod 3.23.8 installed, our range is ^4} => writes a passthrough instead of our zod and reports both versions', async () => {
      npmFake.stageSucceeds();
      const testbed = installTestbedCreateBroker({ baseName: 'npm-sync-version-gate' });
      testbed.writeFile({
        relativePath: 'package.json',
        content: JSON.stringify({ name: 'acme', dependencies: { zod: '^3.23.0' } }),
      });
      testbed.writeFile({
        relativePath: 'packages/@gateway/npm/package.json',
        content: JSON.stringify({ name: '@acme/npm', version: '0.1.0' }),
      });
      testbed.writeFile({
        relativePath: 'node_modules/zod/package.json',
        content: JSON.stringify({
          name: 'zod',
          version: '3.23.8',
          main: 'index.js',
          types: 'index.d.ts',
        }),
      });
      testbed.writeFile({
        relativePath: 'node_modules/zod/index.js',
        content: 'exports.z = { string: () => ({}) };\n',
      });
      testbed.writeFile({
        relativePath: 'node_modules/zod/index.d.ts',
        content: 'export declare const z: { string: () => unknown };\n',
      });

      const result = await gatewayNpmSyncBroker({ repoRoot: testbed.guildPath });

      const barrel = testbed.readFile({ relativePath: 'packages/@gateway/npm/src/zod/zod.ts' });
      const ourStub = testbed.readFile({
        relativePath: 'packages/@gateway/npm/src/zod/zod-string-schema/zod-string-schema.stub.ts',
      });
      testbed.cleanup();

      expect(result).toStrictEqual({
        copied: [],
        generated: ['zod'],
        untyped: [],
        esmOnly: [],
        noRootExport: [],
        skippedOwnCopy: [{ name: 'zod', reason: 'version', installed: '3.23.8', ours: '^4.6.5' }],
      });
      expect(barrel).toBe(`/**
 * PURPOSE: Pass-through for the npm package 'zod'. Code outside the gateway imports zod
 * through here instead of the raw package, so a future guard or override on zod lands in
 * this one file and reaches every caller.
 *
 * USAGE:
 * import { someExport } from '#gateway/npm/zod';
 */

export * from 'zod';
`);
      expect(ourStub).toBe(null);
    });
  });

  describe('a package dungeonmaster wraps, whose installed API our wrapper does not compile against', () => {
    it('VALID: {debug at a version in our range, missing exports our wrapper re-exports} => writes a passthrough, reports the compile skip and leaves none of our files', async () => {
      npmFake.stageSucceeds();
      const testbed = installTestbedCreateBroker({ baseName: 'npm-sync-compile-gate' });
      const installedVersion = sync.minVersionSatisfying({
        range: sync.ownGatewayRange({ packageName: 'debug' }),
      });
      testbed.writeFile({
        relativePath: 'package.json',
        content: JSON.stringify({ name: 'acme', dependencies: { debug: '^4.0.0' } }),
      });
      testbed.writeFile({
        relativePath: 'packages/@gateway/npm/package.json',
        content: JSON.stringify({ name: '@acme/npm', version: '0.1.0' }),
      });
      testbed.writeFile({
        relativePath: 'node_modules/debug/package.json',
        content: JSON.stringify({
          name: 'debug',
          version: installedVersion,
          main: 'index.js',
          types: 'index.d.ts',
        }),
      });
      testbed.writeFile({
        relativePath: 'node_modules/debug/index.js',
        content: 'module.exports = (namespace) => ({ namespace });\n',
      });
      testbed.writeFile({
        relativePath: 'node_modules/debug/index.d.ts',
        content:
          'declare function debug(namespace: string): { namespace: string };\nexport = debug;\n',
      });
      sync.linkInstalledPackage({ repoRoot: testbed.guildPath, packageName: '@types/jest' });

      const result = await gatewayNpmSyncBroker({ repoRoot: testbed.guildPath });

      const barrel = testbed.readFile({ relativePath: 'packages/@gateway/npm/src/debug/debug.ts' });
      const ourStub = testbed.readFile({
        relativePath: 'packages/@gateway/npm/src/debug/debugger/debugger.stub.ts',
      });
      const ourStubTest = testbed.readFile({
        relativePath: 'packages/@gateway/npm/src/debug/debugger/debugger.stub.test.ts',
      });
      const diagnostics = sync.compileDiagnostics({
        repoRoot: testbed.guildPath,
        relativePaths: [
          'packages/@gateway/npm/src/debug/debug.ts',
          'packages/@gateway/npm/src/debug/debug.test.ts',
        ],
      });
      testbed.cleanup();

      expect(result).toStrictEqual({
        copied: [],
        generated: ['debug'],
        untyped: [],
        esmOnly: [],
        noRootExport: [],
        skippedOwnCopy: [
          {
            name: 'debug',
            reason: 'compile',
            installed: installedVersion,
            ours: sync.ownGatewayRange({ packageName: 'debug' }),
            detail:
              "packages/@gateway/npm/src/debug/debug.ts(17): TS2305: Module '\"debug\"' has no exported member 'coerce'.",
          },
        ],
      });
      expect({ ourStub, ourStubTest, diagnostics }).toStrictEqual({
        ourStub: null,
        ourStubTest: null,
        diagnostics: [],
      });
      expect(barrel).toBe(`/**
 * PURPOSE: Pass-through for the npm package 'debug'. Code outside the gateway imports debug
 * through here instead of the raw package, so a future guard or override on debug lands in
 * this one file and reaches every caller.
 *
 * 'debug' declares its module with \`export =\`, which no \`export *\` can re-export
 * (TS2498), so this names every export its declarations held when this file was generated. A
 * name the package adds later is reachable through the default export until it is added here.
 *
 * USAGE:
 * import pkg, { someExport } from '#gateway/npm/debug';
 */

export { default } from 'debug';
`);
    });
  });

  describe('a lockfile refresh that fails', () => {
    it("VALID: {npm install exits 1 after the sync wrote left-pad} => keeps every file it wrote and reports npm's first error line", async () => {
      npmFake.stageFails();
      const testbed = installTestbedCreateBroker({ baseName: 'npm-sync-lockfile-fails' });
      testbed.writeFile({
        relativePath: 'package.json',
        content: JSON.stringify({ name: 'acme', dependencies: { 'left-pad': '^1.3.0' } }),
      });
      testbed.writeFile({
        relativePath: 'packages/@gateway/npm/package.json',
        content: JSON.stringify({ name: '@acme/npm', version: '0.1.0' }),
      });

      const result = await gatewayNpmSyncBroker({ repoRoot: testbed.guildPath });

      const barrel = testbed.readFile({
        relativePath: 'packages/@gateway/npm/src/left-pad/left-pad.ts',
      });
      const gatewayPackageJson = testbed.readFile({
        relativePath: 'packages/@gateway/npm/package.json',
      });
      testbed.cleanup();

      expect(result).toStrictEqual({
        copied: [],
        generated: ['left-pad'],
        untyped: ['left-pad'],
        esmOnly: [],
        noRootExport: [],
        skippedOwnCopy: [],
        lockfileWarning:
          'lockfile not updated: `npm install --ignore-scripts --no-audit --no-fund` exited 1 (npm error code E404); run npm install yourself to update package-lock.json',
      });
      expect(barrel).toBe(`/**
 * PURPOSE: Pass-through for the npm package 'left-pad'. Code outside the gateway imports left-pad
 * through here instead of the raw package, so a future guard or override on left-pad lands in
 * this one file and reaches every caller.
 *
 * 'left-pad' resolved no type declarations when this file was generated, so every import
 * through here is untyped until the package or an @types package supplies them.
 *
 * USAGE:
 * import { someExport } from '#gateway/npm/left-pad';
 */

export * from 'left-pad';
`);
      expect(gatewayPackageJson).toBe(
        `${JSON.stringify(
          { name: '@acme/npm', version: '0.1.0', dependencies: { 'left-pad': '^1.3.0' } },
          null,
          2,
        )}\n`,
      );
    });
  });

  describe('a consumer-shaped repo, as init leaves it before anything is installed', () => {
    it('VALID: {root and gateway tsconfig as init writes them, no @types/jest, elkjs in our range} => compiles our elkjs wrapper and stub under that tsconfig and copies it byte for byte', async () => {
      npmFake.stageSucceeds();
      const testbed = installTestbedCreateBroker({ baseName: 'npm-sync-consumer-tsconfig' });
      testbed.writeFile({
        relativePath: 'package.json',
        content: JSON.stringify({ name: 'acme', dependencies: { elkjs: '^0.10.0' } }),
      });
      testbed.writeFile({
        relativePath: 'tsconfig.json',
        content: JSON.stringify({
          compilerOptions: {
            target: 'ES2022',
            module: 'node16',
            moduleResolution: 'node16',
            customConditions: ['source'],
            lib: ['ES2022'],
            esModuleInterop: true,
            skipLibCheck: true,
            resolveJsonModule: true,
            strict: true,
            noUnusedLocals: true,
            noUnusedParameters: true,
            noImplicitReturns: true,
            exactOptionalPropertyTypes: true,
            noUncheckedIndexedAccess: true,
            noEmit: true,
            typeRoots: ['./node_modules/@types', './@types'],
          },
          files: [],
        }),
      });
      testbed.writeFile({
        relativePath: 'packages/@gateway/npm/package.json',
        content: JSON.stringify({ name: '@acme/npm', version: '0.1.0' }),
      });
      testbed.writeFile({
        relativePath: 'packages/@gateway/npm/tsconfig.json',
        content: JSON.stringify({
          compilerOptions: {
            typeRoots: ['../../../node_modules/@types', '../../../@types', './@types'],
          },
          include: ['**/*.ts', '@types/**/*'],
          exclude: ['node_modules', 'dist'],
          extends: '../../../tsconfig.json',
        }),
      });
      testbed.writeFile({
        relativePath: 'node_modules/elkjs/package.json',
        content: JSON.stringify({
          name: 'elkjs',
          version: sync.minVersionSatisfying({
            range: sync.ownGatewayRange({ packageName: 'elkjs' }),
          }),
          main: 'index.js',
          types: 'index.d.ts',
        }),
      });
      testbed.writeFile({
        relativePath: 'node_modules/elkjs/index.js',
        content: 'module.exports = class ELK {};\n',
      });
      testbed.writeFile({
        relativePath: 'node_modules/elkjs/index.d.ts',
        content:
          'export interface ElkNode {\n  id: string;\n  x?: number;\n  y?: number;\n  width?: number;\n  height?: number;\n  children?: ElkNode[];\n}\ndeclare class ELK {\n  layout<T extends ElkNode>(graph: T): Promise<T>;\n}\nexport default ELK;\n',
      });
      sync.linkInstalledPackage({ repoRoot: testbed.guildPath, packageName: 'typescript' });

      const result = await gatewayNpmSyncBroker({ repoRoot: testbed.guildPath });

      const stub = testbed.readFile({
        relativePath: 'packages/@gateway/npm/src/elkjs/elk-layout-result/elk-layout-result.stub.ts',
      });
      testbed.cleanup();

      expect(result).toStrictEqual({
        copied: ['elkjs'],
        generated: [],
        untyped: [],
        esmOnly: [],
        noRootExport: [],
        skippedOwnCopy: [],
      });
      expect(stub).toBe(
        sync.readOwnGatewayFile({
          relativePath: 'elkjs/elk-layout-result/elk-layout-result.stub.ts',
        }),
      );
    });
  });

  describe('an installed package with no root export', () => {
    it('VALID: {our subpath folders refused, two of their subpaths exported} => writes a passthrough per resolving subpath and no root barrel', async () => {
      npmFake.stageSucceeds();
      const testbed = installTestbedCreateBroker({ baseName: 'npm-sync-no-root-subpaths' });
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
      testbed.writeFile({
        relativePath: 'node_modules/@modelcontextprotocol/sdk/package.json',
        content: JSON.stringify({
          name: '@modelcontextprotocol/sdk',
          version: '1.0.0',
          exports: {
            './server/mcp.js': { types: './mcp.d.ts', default: './mcp.js' },
            './types.js': { types: './types.d.ts', default: './types.js' },
          },
        }),
      });
      testbed.writeFile({
        relativePath: 'node_modules/@modelcontextprotocol/sdk/mcp.d.ts',
        content: 'export declare const mcpVersion: number;\n',
      });
      testbed.writeFile({
        relativePath: 'node_modules/@modelcontextprotocol/sdk/mcp.js',
        content: 'exports.mcpVersion = 1;\n',
      });
      testbed.writeFile({
        relativePath: 'node_modules/@modelcontextprotocol/sdk/types.d.ts',
        content: 'export declare const typesVersion: number;\n',
      });
      testbed.writeFile({
        relativePath: 'node_modules/@modelcontextprotocol/sdk/types.js',
        content: 'exports.typesVersion = 1;\n',
      });

      const result = await gatewayNpmSyncBroker({ repoRoot: testbed.guildPath });

      const mcpBarrel = testbed.readFile({
        relativePath:
          'packages/@gateway/npm/src/modelcontextprotocol__sdk__server__mcp/modelcontextprotocol__sdk__server__mcp.ts',
      });
      const rootBarrel = testbed.readFile({
        relativePath:
          'packages/@gateway/npm/src/modelcontextprotocol__sdk/modelcontextprotocol__sdk.ts',
      });
      const serverBarrel = testbed.readFile({
        relativePath:
          'packages/@gateway/npm/src/modelcontextprotocol__sdk__server/modelcontextprotocol__sdk__server.ts',
      });
      const diagnostics = sync.compileDiagnostics({
        repoRoot: testbed.guildPath,
        relativePaths: [
          'packages/@gateway/npm/src/modelcontextprotocol__sdk__server__mcp/modelcontextprotocol__sdk__server__mcp.ts',
          'packages/@gateway/npm/src/modelcontextprotocol__sdk__types/modelcontextprotocol__sdk__types.ts',
        ],
      });
      testbed.cleanup();

      expect(result).toStrictEqual({
        copied: [],
        generated: ['modelcontextprotocol__sdk__server__mcp', 'modelcontextprotocol__sdk__types'],
        untyped: [],
        esmOnly: [],
        noRootExport: [],
        skippedOwnCopy: [
          {
            name: '@modelcontextprotocol/sdk',
            reason: 'compile',
            installed: '1.0.0',
            ours: '^1.0.0',
            detail:
              "packages/@gateway/npm/src/modelcontextprotocol__sdk__server/modelcontextprotocol__sdk__server.ts(10): TS2307: Cannot find module '@modelcontextprotocol/sdk/server' or its corresponding type declarations.",
          },
        ],
      });
      expect({ rootBarrel, serverBarrel, diagnostics }).toStrictEqual({
        rootBarrel: null,
        serverBarrel: null,
        diagnostics: [],
      });
      expect(mcpBarrel).toBe(`/**
 * PURPOSE: Pass-through for the npm package '@modelcontextprotocol/sdk/server/mcp.js'. Code outside the gateway imports @modelcontextprotocol/sdk/server/mcp.js
 * through here instead of the raw package, so a future guard or override on @modelcontextprotocol/sdk/server/mcp.js lands in
 * this one file and reaches every caller.
 *
 * USAGE:
 * import { someExport } from '#gateway/npm/modelcontextprotocol__sdk__server__mcp';
 */

export * from '@modelcontextprotocol/sdk/server/mcp.js';
`);
    });

    it('VALID: {no root export and no subpath folder of ours} => writes nothing, leaves the gateway package.json alone and reports it', async () => {
      npmFake.stageSucceeds();
      const testbed = installTestbedCreateBroker({ baseName: 'npm-sync-no-root-nothing' });
      const gatewayPackageJson = JSON.stringify({ name: '@acme/npm', version: '0.1.0' });
      testbed.writeFile({
        relativePath: 'package.json',
        content: JSON.stringify({ name: 'acme', dependencies: { 'sub-only-lib': '^2.0.0' } }),
      });
      testbed.writeFile({
        relativePath: 'packages/@gateway/npm/package.json',
        content: gatewayPackageJson,
      });
      testbed.writeFile({
        relativePath: 'node_modules/sub-only-lib/package.json',
        content: JSON.stringify({
          name: 'sub-only-lib',
          version: '2.0.0',
          exports: { './server': { types: './server.d.ts', default: './server.js' } },
        }),
      });
      testbed.writeFile({
        relativePath: 'node_modules/sub-only-lib/server.d.ts',
        content: 'export declare const serve: () => void;\n',
      });

      const result = await gatewayNpmSyncBroker({ repoRoot: testbed.guildPath });

      const rootBarrel = testbed.readFile({
        relativePath: 'packages/@gateway/npm/src/sub-only-lib/sub-only-lib.ts',
      });
      const packageJsonAfter = testbed.readFile({
        relativePath: 'packages/@gateway/npm/package.json',
      });
      testbed.cleanup();

      expect(result).toStrictEqual({
        copied: [],
        generated: [],
        untyped: [],
        esmOnly: [],
        noRootExport: ['sub-only-lib'],
        skippedOwnCopy: [],
      });
      expect({ rootBarrel, packageJsonAfter }).toStrictEqual({
        rootBarrel: null,
        packageJsonAfter: gatewayPackageJson,
      });
    });
  });
});
