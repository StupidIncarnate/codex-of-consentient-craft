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
      ownFolders: { elkjs: { 'elkjs.ts': "export * from 'elkjs';\n" } },
      gatewayPackageJson: { name: '@acme/npm' },
      passthroughFolders: ['left-pad'],
    });

    const result = await gatewayNpmSyncBroker({ repoRoot: REPO_ROOT });

    expect(result).toStrictEqual({
      copied: ['elkjs'],
      generated: ['left-pad'],
      untyped: ['left-pad'],
      esmOnly: [],
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
      ownFolders: { elkjs: { 'elkjs.ts': "export * from 'elkjs';\n" } },
      gatewayPackageJson: { name: '@acme/npm', dependencies: { elkjs: '^0.11.0' } },
      passthroughFolders: [],
    });

    const result = await gatewayNpmSyncBroker({ repoRoot: REPO_ROOT });

    expect(result).toStrictEqual({ copied: [], generated: [], untyped: [], esmOnly: [] });
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

    expect(result).toStrictEqual({ copied: [], generated: [], untyped: [], esmOnly: [] });
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
      ownFolders: { elkjs: { 'elkjs.ts': "export * from 'elkjs';\n" } },
      gatewayPackageJson: { name: '@acme/npm' },
      passthroughFolders: ['left-pad'],
    });

    const result = await gatewayNpmSyncBroker({ repoRoot: REPO_ROOT });

    expect(result).toStrictEqual({
      copied: ['elkjs'],
      generated: ['left-pad'],
      untyped: ['left-pad'],
      esmOnly: [],
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

    expect(result).toStrictEqual({ copied: [], generated: [], untyped: [], esmOnly: [] });
    expect(proxy.removedPaths({ repoRoot: REPO_ROOT })).toStrictEqual([]);
    expect(proxy.installCalls()).toStrictEqual([]);
  });

  it('EMPTY: {no npm gateway package} => returns an empty report', async () => {
    const proxy = gatewayNpmSyncBrokerProxy();
    proxy.setupNoGateway({ repoRoot: REPO_ROOT });

    const result = await gatewayNpmSyncBroker({ repoRoot: REPO_ROOT });

    expect(result).toStrictEqual({ copied: [], generated: [], untyped: [], esmOnly: [] });
  });

  it('ERROR: {npm install exits non-zero} => throws naming the command and its output', async () => {
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
    proxy.setupInstallFails({ repoRoot: REPO_ROOT, output: 'npm ERR! 404 left-pad' });

    await expect(gatewayNpmSyncBroker({ repoRoot: REPO_ROOT })).rejects.toThrow(
      /^gateway npm sync: `npm install --ignore-scripts --no-audit --no-fund` in \/repo exited 1:\nnpm ERR! 404 left-pad$/u,
    );
  });
});
