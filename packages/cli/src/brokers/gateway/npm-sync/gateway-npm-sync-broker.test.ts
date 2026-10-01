import { gatewayNpmSyncBroker } from './gateway-npm-sync-broker';
import { gatewayNpmSyncBrokerProxy } from './gateway-npm-sync-broker.proxy';

const REPO_ROOT = '/repo';
const SRC_ROOT = '/repo/packages/@gateway/npm/src';

describe('gatewayNpmSyncBroker', () => {
  it('VALID: {one wrapped dependency, one unwrapped} => copies ours, generates a passthrough, records both and installs once', async () => {
    const proxy = gatewayNpmSyncBrokerProxy();
    proxy.setupSync({
      repoRoot: REPO_ROOT,
      npmCommand: 'install',
      rootPackageJson: {
        name: 'acme',
        dependencies: { elkjs: '^0.11.0', 'left-pad': '^1.3.0' },
      },
      consumerFolders: [],
      ownFolders: { elkjs: { 'elkjs.ts': 'export const elk = 1;\n' } },
      gatewayPackageJson: { name: '@acme/npm' },
      passthroughFolders: ['left-pad'],
    });

    const result = await gatewayNpmSyncBroker({ repoRoot: REPO_ROOT });

    expect(result).toStrictEqual({
      copied: ['elkjs'],
      generated: ['left-pad'],
      untyped: ['left-pad'],
      esmOnly: [],
      skippedOwnCopy: [],
    });
    expect(proxy.copiedFolders()).toStrictEqual([
      [`${proxy.ownSrcRoot()}/elkjs`, `${SRC_ROOT}/elkjs`, { recursive: true }],
    ]);
    expect(proxy.writtenFiles({ repoRoot: REPO_ROOT, folder: 'left-pad' })).toStrictEqual([
      `/**
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
`,
      `import * as ourModule from './left-pad';
// A raw \`require\`, not \`import * as\`: TS's importStar helper synthesizes a .default onto any
// CJS module that lacks __esModule, which is every third-party package here — comparing
// against that synthetic shape would fail every pass-through. \`import x = require(...)\` compiles
// straight to \`require(...)\`, so pkgModule is the package's own real runtime shape.
import pkgModule = require('left-pad');

describe('#gateway/npm/left-pad', () => {
  it('VALID: {module} => re-exports the same runtime bindings as left-pad', () => {
    expect(Object.keys(ourModule).sort()).toStrictEqual(Object.keys(pkgModule).sort());
  });
});
`,
    ]);
    expect(proxy.writtenGatewayPackageJson({ repoRoot: REPO_ROOT })).toBe(
      `${JSON.stringify(
        { name: '@acme/npm', dependencies: { elkjs: '^0.11.0', 'left-pad': '^1.3.0' } },
        null,
        2,
      )}\n`,
    );
    expect({
      removed: proxy.removedPaths({ repoRoot: REPO_ROOT }),
      installs: proxy.installCalls(),
    }).toStrictEqual({
      removed: [[`${SRC_ROOT}/index.d.ts`]],
      installs: [['install', '--ignore-scripts', '--no-audit', '--no-fund']],
    });
  });

  it('VALID: {every folder already present} => writes nothing and runs no install', async () => {
    const proxy = gatewayNpmSyncBrokerProxy();
    proxy.setupSync({
      repoRoot: REPO_ROOT,
      npmCommand: 'install',
      rootPackageJson: { name: 'acme', dependencies: { elkjs: '^0.11.0' } },
      consumerFolders: ['elkjs'],
      ownFolders: { elkjs: { 'elkjs.ts': 'export const elk = 1;\n' } },
      gatewayPackageJson: { name: '@acme/npm', dependencies: { elkjs: '^0.11.0' } },
      passthroughFolders: [],
    });

    const result = await gatewayNpmSyncBroker({ repoRoot: REPO_ROOT });

    expect(result).toStrictEqual({
      copied: [],
      generated: [],
      untyped: [],
      esmOnly: [],
      skippedOwnCopy: [],
    });
    expect(proxy.copiedFolders()).toStrictEqual([]);
    expect(proxy.writtenGatewayPackageJson({ repoRoot: REPO_ROOT })).toBe(undefined);
    expect(proxy.removedPaths({ repoRoot: REPO_ROOT })).toStrictEqual([[`${SRC_ROOT}/index.d.ts`]]);
    expect(proxy.installCalls()).toStrictEqual([]);
  });

  it('VALID: {a consumer subpath folder wraps the dependency} => treats it as covered and writes nothing', async () => {
    const proxy = gatewayNpmSyncBrokerProxy();
    proxy.setupSync({
      repoRoot: REPO_ROOT,
      npmCommand: 'install',
      rootPackageJson: { name: 'acme', dependencies: { 'react-dom': '^19.0.0' } },
      consumerFolders: ['react-dom__client'],
      consumerBarrels: { 'react-dom__client': "export * from 'react-dom/client';\n" },
      ownFolders: {},
      gatewayPackageJson: { name: '@acme/npm', dependencies: { 'react-dom': '^19.0.0' } },
      passthroughFolders: [],
    });

    const result = await gatewayNpmSyncBroker({ repoRoot: REPO_ROOT });

    expect(result).toStrictEqual({
      copied: [],
      generated: [],
      untyped: [],
      esmOnly: [],
      skippedOwnCopy: [],
    });
    expect({
      written: proxy.writtenFiles({ repoRoot: REPO_ROOT, folder: 'react-dom' }),
      packageJson: proxy.writtenGatewayPackageJson({ repoRoot: REPO_ROOT }),
      installs: proxy.installCalls(),
    }).toStrictEqual({ written: [undefined, undefined], packageJson: undefined, installs: [] });
  });

  it('VALID: {npm_command=ci} => reports the plan and writes nothing', async () => {
    const proxy = gatewayNpmSyncBrokerProxy();
    proxy.setupSync({
      repoRoot: REPO_ROOT,
      npmCommand: 'ci',
      rootPackageJson: { name: 'acme', dependencies: { elkjs: '^0.11.0', 'left-pad': '^1.3.0' } },
      consumerFolders: null,
      ownFolders: { elkjs: { 'elkjs.ts': 'export const elk = 1;\n' } },
      gatewayPackageJson: { name: '@acme/npm' },
      passthroughFolders: ['left-pad'],
    });

    const result = await gatewayNpmSyncBroker({ repoRoot: REPO_ROOT });

    expect(result).toStrictEqual({
      copied: ['elkjs'],
      generated: ['left-pad'],
      untyped: ['left-pad'],
      esmOnly: [],
      skippedOwnCopy: [],
    });
    expect(proxy.copiedFolders()).toStrictEqual([]);
    expect(proxy.writtenFiles({ repoRoot: REPO_ROOT, folder: 'left-pad' })).toStrictEqual([
      undefined,
      undefined,
    ]);
    expect({
      packageJson: proxy.writtenGatewayPackageJson({ repoRoot: REPO_ROOT }),
      removed: proxy.removedPaths({ repoRoot: REPO_ROOT }),
      installs: proxy.installCalls(),
    }).toStrictEqual({ packageJson: undefined, removed: [], installs: [] });
  });

  it('EMPTY: {no dependencies and no subpath yet} => leaves the placeholder and does nothing', async () => {
    const proxy = gatewayNpmSyncBrokerProxy();
    proxy.setupSync({
      repoRoot: REPO_ROOT,
      npmCommand: 'install',
      rootPackageJson: { name: 'acme' },
      consumerFolders: [],
      ownFolders: {},
      gatewayPackageJson: { name: '@acme/npm' },
      passthroughFolders: [],
    });

    const result = await gatewayNpmSyncBroker({ repoRoot: REPO_ROOT });

    expect(result).toStrictEqual({
      copied: [],
      generated: [],
      untyped: [],
      esmOnly: [],
      skippedOwnCopy: [],
    });
    expect(proxy.removedPaths({ repoRoot: REPO_ROOT })).toStrictEqual([]);
    expect(proxy.installCalls()).toStrictEqual([]);
  });

  it('EMPTY: {no npm gateway package} => returns an empty report', async () => {
    const proxy = gatewayNpmSyncBrokerProxy();
    proxy.setupNoGateway({ repoRoot: REPO_ROOT });

    const result = await gatewayNpmSyncBroker({ repoRoot: REPO_ROOT });

    expect(result).toStrictEqual({
      copied: [],
      generated: [],
      untyped: [],
      esmOnly: [],
      skippedOwnCopy: [],
    });
  });

  it("VALID: {npm install exits non-zero} => keeps what it wrote and reports a lockfile warning naming npm's first error line", async () => {
    const proxy = gatewayNpmSyncBrokerProxy();
    proxy.setupSync({
      repoRoot: REPO_ROOT,
      npmCommand: 'install',
      rootPackageJson: { name: 'acme', dependencies: { 'left-pad': '^1.3.0' } },
      consumerFolders: [],
      ownFolders: {},
      gatewayPackageJson: { name: '@acme/npm' },
      passthroughFolders: ['left-pad'],
    });
    proxy.setupInstallFails({
      repoRoot: REPO_ROOT,
      output:
        "npm error code E404\nnpm error 404 Not Found - GET https://registry.npmjs.org/@acme%2fmissing - Not found\nnpm error 404  '@acme/missing@*' is not in this registry.\n",
    });

    const result = await gatewayNpmSyncBroker({ repoRoot: REPO_ROOT });

    expect(result).toStrictEqual({
      copied: [],
      generated: ['left-pad'],
      untyped: ['left-pad'],
      esmOnly: [],
      skippedOwnCopy: [],
      lockfileWarning:
        'lockfile not updated: `npm install --ignore-scripts --no-audit --no-fund` exited 1 (npm error code E404); run npm install yourself to update package-lock.json',
    });
    expect({
      installs: proxy.installCalls(),
      packageJson: proxy.writtenGatewayPackageJson({ repoRoot: REPO_ROOT }),
    }).toStrictEqual({
      installs: [['install', '--ignore-scripts', '--no-audit', '--no-fund']],
      packageJson: `${JSON.stringify({ name: '@acme/npm', dependencies: { 'left-pad': '^1.3.0' } }, null, 2)}\n`,
    });
  });

  it('VALID: {npm install exits non-zero with no npm error line} => falls back to its first output line', async () => {
    const proxy = gatewayNpmSyncBrokerProxy();
    proxy.setupSync({
      repoRoot: REPO_ROOT,
      npmCommand: 'install',
      rootPackageJson: { name: 'acme', dependencies: { 'left-pad': '^1.3.0' } },
      consumerFolders: [],
      ownFolders: {},
      gatewayPackageJson: { name: '@acme/npm' },
      passthroughFolders: ['left-pad'],
    });
    proxy.setupInstallFails({ repoRoot: REPO_ROOT, output: '\nERESOLVE could not resolve\n' });

    const result = await gatewayNpmSyncBroker({ repoRoot: REPO_ROOT });

    expect(result.lockfileWarning).toBe(
      'lockfile not updated: `npm install --ignore-scripts --no-audit --no-fund` exited 1 (ERESOLVE could not resolve); run npm install yourself to update package-lock.json',
    );
  });

  it('VALID: {installed version outside our range} => writes a passthrough instead and reports the skip with both versions', async () => {
    const proxy = gatewayNpmSyncBrokerProxy();
    proxy.setupSync({
      repoRoot: REPO_ROOT,
      npmCommand: 'install',
      rootPackageJson: { name: 'acme', dependencies: { zod: '^3.23.0' } },
      consumerFolders: [],
      ownFolders: { zod: { 'zod.ts': 'export const zodLike = 1;\n' } },
      gatewayPackageJson: { name: '@acme/npm' },
      passthroughFolders: ['zod'],
      ownRanges: { zod: '^4.6.5' },
      installedVersions: { zod: '3.23.8' },
    });

    const result = await gatewayNpmSyncBroker({ repoRoot: REPO_ROOT });

    expect(result).toStrictEqual({
      copied: [],
      generated: ['zod'],
      untyped: ['zod'],
      esmOnly: [],
      skippedOwnCopy: [{ name: 'zod', reason: 'version', installed: '3.23.8', ours: '^4.6.5' }],
    });
    expect(proxy.copiedFolders()).toStrictEqual([]);
  });

  it('VALID: {our folder does not compile against what is installed} => writes a passthrough instead and reports a compile skip', async () => {
    const proxy = gatewayNpmSyncBrokerProxy();
    proxy.setupSync({
      repoRoot: REPO_ROOT,
      npmCommand: 'install',
      rootPackageJson: { name: 'acme', dependencies: { elkjs: '^0.11.0' } },
      consumerFolders: [],
      ownFolders: { elkjs: { 'elkjs.ts': "export const elk: number = 'one';\n" } },
      gatewayPackageJson: { name: '@acme/npm' },
      passthroughFolders: ['elkjs'],
    });

    const result = await gatewayNpmSyncBroker({ repoRoot: REPO_ROOT });

    expect(result).toStrictEqual({
      copied: [],
      generated: ['elkjs'],
      untyped: ['elkjs'],
      esmOnly: [],
      skippedOwnCopy: [{ name: 'elkjs', reason: 'compile', installed: '1.0.0', ours: '*' }],
    });
    expect(proxy.copiedFolders()).toStrictEqual([]);
  });

  it('VALID: {our folder imports a package the consumer does not declare} => reports an unresolved-import skip', async () => {
    const proxy = gatewayNpmSyncBrokerProxy();
    proxy.setupSync({
      repoRoot: REPO_ROOT,
      npmCommand: 'install',
      rootPackageJson: { name: 'acme', dependencies: { elkjs: '^0.11.0' } },
      consumerFolders: [],
      ownFolders: { elkjs: { 'elkjs.ts': "export * from 'web-worker';\n" } },
      gatewayPackageJson: { name: '@acme/npm' },
      passthroughFolders: ['elkjs'],
    });

    const result = await gatewayNpmSyncBroker({ repoRoot: REPO_ROOT });

    expect(result).toStrictEqual({
      copied: [],
      generated: ['elkjs'],
      untyped: ['elkjs'],
      esmOnly: [],
      skippedOwnCopy: [
        { name: 'elkjs', reason: 'unresolved-import', installed: '1.0.0', ours: '*' },
      ],
    });
  });
});
