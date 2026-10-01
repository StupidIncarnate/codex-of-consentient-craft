import { InstallSetupGatewayResponder } from './install-setup-gateway-responder';
import { InstallSetupGatewayResponderProxy } from './install-setup-gateway-responder.proxy';
import { PackageJsonRawStub } from '@dungeonmaster/shared/contracts/package-json-raw/package-json-raw.stub';
import { InstallContextStub } from '@dungeonmaster/shared/contracts/install-context/install-context.stub';

describe('InstallSetupGatewayResponder', () => {
  it('EMPTY: {context: no package.json} => returns skipped without touching anything else', async () => {
    const proxy = InstallSetupGatewayResponderProxy();
    const targetProjectRoot = '/repo';
    proxy.setupNoRootPackageJson({
      rootPackageJsonPath: '/repo/package.json',
    });

    const result = await InstallSetupGatewayResponder({
      context: InstallContextStub({
        value: { targetProjectRoot, dungeonmasterRoot: targetProjectRoot },
      }),
    });

    expect(result).toStrictEqual({
      packageName: '@dungeonmaster/cli',
      success: false,
      action: 'skipped',
      message: 'No package.json found',
    });
  });

  it('VALID: {context: workspaces, gateway folders, root tsconfig node16, and one package all already in place} => returns skipped without writing anything', async () => {
    const proxy = InstallSetupGatewayResponderProxy();
    const targetProjectRoot = '/repo';

    const rootPackageJson = PackageJsonRawStub({
      name: '@acme/app',
      version: '1.0.0',
      workspaces: ['packages/*', 'packages/@gateway/*'],
      scripts: {
        postinstall:
          'if command -v dungeonmaster >/dev/null 2>&1; then dungeonmaster gateway-sync; fi',
      },
    });

    proxy.setupRootPackageJson({
      rootPackageJsonPath: '/repo/package.json',
      content: JSON.stringify(rootPackageJson),
    });

    for (const folder of ['npm', 'node', 'browser', 'bin']) {
      proxy.setupGatewayFolderExists({
        packageRoot: `/repo/packages/@gateway/${folder}`,
      });
    }

    proxy.setupRootTsconfig({
      rootTsconfigPath: '/repo/tsconfig.json',
      content: `{
  "compilerOptions": {
    "module": "node16",
    "moduleResolution": "node16",
    "customConditions": ["source"]
  }
}
`,
    });

    proxy.setupNpmGatewaySync({
      repoRoot: '/repo',
      rootPackageJson,
      consumerFolders: [],
      passthroughFolders: [],
    });

    proxy.setupExistingPackages({
      packagesDir: '/repo/packages',
      packages: [{ name: 'app', hasPackageJson: true }],
    });

    proxy.setupPackageJson({
      packageJsonPath: '/repo/packages/app/package.json',
      content: JSON.stringify({
        name: '@acme/app',
        imports: {
          '#gateway/npm/*': '@acme/npm/*',
          '#gateway/node/*': '@acme/node/*',
          '#gateway/browser/*': '@acme/browser/*',
          '#gateway/bin/*': '@acme/bin/*',
        },
      }),
    });

    proxy.setupPackageTsconfigBuildMissing({
      tsconfigBuildPath: '/repo/packages/app/tsconfig.build.json',
    });

    const result = await InstallSetupGatewayResponder({
      context: InstallContextStub({
        value: { targetProjectRoot, dungeonmasterRoot: targetProjectRoot },
      }),
    });

    expect(result).toStrictEqual({
      packageName: '@dungeonmaster/cli',
      success: true,
      action: 'skipped',
      message:
        'workspaces already includes packages/@gateway/*; root postinstall script already runs gateway-sync; gateway packages already scaffolded; packages/@gateway/npm/src already has a folder for every dependency; tsconfig.json already resolves node16; updated imports in 0 existing package(s); set gateway-dist in tsconfig.build.json of 0 existing package(s)',
    });
    expect(proxy.getWrittenFiles()).toStrictEqual([]);
  });

  it('EMPTY: {context: root tsconfig.json missing, everything else already in place} => reports it by name instead of claiming it already resolves node16', async () => {
    const proxy = InstallSetupGatewayResponderProxy();
    const targetProjectRoot = '/repo';

    const rootPackageJson = PackageJsonRawStub({
      name: '@acme/app',
      version: '1.0.0',
      workspaces: ['packages/*', 'packages/@gateway/*'],
      scripts: {
        postinstall:
          'if command -v dungeonmaster >/dev/null 2>&1; then dungeonmaster gateway-sync; fi',
      },
    });

    proxy.setupRootPackageJson({
      rootPackageJsonPath: '/repo/package.json',
      content: JSON.stringify(rootPackageJson),
    });

    for (const folder of ['npm', 'node', 'browser', 'bin']) {
      proxy.setupGatewayFolderExists({
        packageRoot: `/repo/packages/@gateway/${folder}`,
      });
    }

    proxy.setupRootTsconfigMissing({
      rootTsconfigPath: '/repo/tsconfig.json',
    });

    proxy.setupNpmGatewaySync({
      repoRoot: '/repo',
      rootPackageJson,
      consumerFolders: [],
      passthroughFolders: [],
    });

    proxy.setupExistingPackages({
      packagesDir: '/repo/packages',
      packages: [],
    });

    const result = await InstallSetupGatewayResponder({
      context: InstallContextStub({
        value: { targetProjectRoot, dungeonmasterRoot: targetProjectRoot },
      }),
    });

    expect(result).toStrictEqual({
      packageName: '@dungeonmaster/cli',
      success: true,
      action: 'skipped',
      message:
        'workspaces already includes packages/@gateway/*; root postinstall script already runs gateway-sync; gateway packages already scaffolded; packages/@gateway/npm/src already has a folder for every dependency; no tsconfig.json found to set node16 resolution in; updated imports in 0 existing package(s); set gateway-dist in tsconfig.build.json of 0 existing package(s)',
    });
    expect(proxy.getWrittenFiles()).toStrictEqual([]);
  });

  it('VALID: {context: root tsconfig on commonjs, one package with a build config} => sets the root postinstall, node16 in the root and gateway-dist in the build config, and says the npm gateway has no package.json to fill', async () => {
    const proxy = InstallSetupGatewayResponderProxy();
    const targetProjectRoot = '/repo';

    proxy.setupRootPackageJson({
      rootPackageJsonPath: '/repo/package.json',
      content: JSON.stringify({
        name: '@acme/app',
        version: '1.0.0',
        workspaces: ['packages/*', 'packages/@gateway/*'],
      }),
    });

    for (const folder of ['npm', 'node', 'browser', 'bin']) {
      proxy.setupGatewayFolderExists({
        packageRoot: `/repo/packages/@gateway/${folder}`,
      });
    }

    proxy.setupRootTsconfig({
      rootTsconfigPath: '/repo/tsconfig.json',
      content: `{
  "compilerOptions": {
    "module": "commonjs"
  }
}
`,
    });

    proxy.setupNpmGatewayPackageMissing({ repoRoot: '/repo' });

    proxy.setupExistingPackages({
      packagesDir: '/repo/packages',
      packages: [{ name: 'app', hasPackageJson: true }],
    });

    proxy.setupPackageJson({
      packageJsonPath: '/repo/packages/app/package.json',
      content: JSON.stringify({
        name: '@acme/app',
        imports: {
          '#gateway/npm/*': '@acme/npm/*',
          '#gateway/node/*': '@acme/node/*',
          '#gateway/browser/*': '@acme/browser/*',
          '#gateway/bin/*': '@acme/bin/*',
        },
      }),
    });

    proxy.setupPackageTsconfig({
      tsconfigPath: '/repo/packages/app/tsconfig.build.json',
      content: `{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "outDir": "./dist"
  }
}
`,
    });

    const result = await InstallSetupGatewayResponder({
      context: InstallContextStub({
        value: { targetProjectRoot, dungeonmasterRoot: targetProjectRoot },
      }),
    });

    expect(result).toStrictEqual({
      packageName: '@dungeonmaster/cli',
      success: true,
      action: 'created',
      message:
        'workspaces already includes packages/@gateway/*; set the root postinstall script to run dungeonmaster gateway-sync; gateway packages already scaffolded; no packages/@gateway/npm/package.json to sync dependencies into; set node16 resolution in tsconfig.json; updated imports in 0 existing package(s); set gateway-dist in tsconfig.build.json of 1 existing package(s)',
    });
    expect(proxy.getWrittenFiles()).toStrictEqual([
      {
        path: '/repo/package.json',
        content: `{
  "name": "@acme/app",
  "version": "1.0.0",
  "workspaces": [
    "packages/*",
    "packages/@gateway/*"
  ],
  "scripts": {
    "postinstall": "if command -v dungeonmaster >/dev/null 2>&1; then dungeonmaster gateway-sync; fi"
  }
}
`,
      },
      {
        path: '/repo/tsconfig.json',
        content: `{
  "compilerOptions": {
    "module": "node16",
    "moduleResolution": "node16",
    "customConditions": ["source"]
  }
}
`,
      },
      {
        path: '/repo/packages/app/tsconfig.build.json',
        content: `{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "outDir": "./dist",
    "customConditions": ["gateway-dist", "source"]
  }
}
`,
      },
    ]);
    expect(proxy.getCopiedSources()).toStrictEqual([]);
  });

  it('VALID: {context: gateway in place, root depends on left-pad with no gateway folder, husky postinstall} => appends the sync to postinstall, generates the left-pad passthrough and names it in the message', async () => {
    const proxy = InstallSetupGatewayResponderProxy();
    const targetProjectRoot = '/repo';
    const rootPackageJson = PackageJsonRawStub({
      name: '@acme/app',
      version: '1.0.0',
      workspaces: ['packages/*', 'packages/@gateway/*'],
      scripts: { postinstall: 'husky' },
      dependencies: { 'left-pad': '^1.3.0' },
    });

    proxy.setupRootPackageJson({
      rootPackageJsonPath: '/repo/package.json',
      content: JSON.stringify(rootPackageJson),
    });

    for (const folder of ['npm', 'node', 'browser', 'bin']) {
      proxy.setupGatewayFolderExists({
        packageRoot: `/repo/packages/@gateway/${folder}`,
      });
    }

    proxy.setupNpmGatewaySync({
      repoRoot: '/repo',
      rootPackageJson,
      consumerFolders: [],
      passthroughFolders: ['left-pad'],
    });

    proxy.setupRootTsconfig({
      rootTsconfigPath: '/repo/tsconfig.json',
      content: `{
  "compilerOptions": {
    "module": "node16",
    "moduleResolution": "node16",
    "customConditions": ["source"]
  }
}
`,
    });

    proxy.setupExistingPackages({
      packagesDir: '/repo/packages',
      packages: [],
    });

    const result = await InstallSetupGatewayResponder({
      context: InstallContextStub({
        value: { targetProjectRoot, dungeonmasterRoot: targetProjectRoot },
      }),
    });

    expect(result).toStrictEqual({
      packageName: '@dungeonmaster/cli',
      success: true,
      action: 'created',
      message:
        'workspaces already includes packages/@gateway/*; set the root postinstall script to run dungeonmaster gateway-sync; gateway packages already scaffolded; synced packages/@gateway/npm/src (generated: left-pad / untyped: left-pad); tsconfig.json already resolves node16; updated imports in 0 existing package(s); set gateway-dist in tsconfig.build.json of 0 existing package(s)',
    });
    expect(proxy.getWrittenFiles()).toStrictEqual([
      {
        path: '/repo/package.json',
        content: `{
  "name": "@acme/app",
  "version": "1.0.0",
  "workspaces": [
    "packages/*",
    "packages/@gateway/*"
  ],
  "scripts": {
    "postinstall": "husky && if command -v dungeonmaster >/dev/null 2>&1; then dungeonmaster gateway-sync; fi"
  },
  "dependencies": {
    "left-pad": "^1.3.0"
  }
}
`,
      },
    ]);
    expect({
      leftPadBarrel: proxy.getNpmGatewayWrittenFiles({ repoRoot: '/repo', folder: 'left-pad' })[0],
      installs: proxy.getNpmGatewayInstallCalls(),
    }).toStrictEqual({
      leftPadBarrel: `/**
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
      installs: [['install', '--ignore-scripts', '--no-audit', '--no-fund']],
    });
  });

  it('VALID: {context: the lockfile npm install fails after the sync wrote left-pad} => still succeeds and carries the lockfile warning in its message', async () => {
    const proxy = InstallSetupGatewayResponderProxy();
    const targetProjectRoot = '/repo';
    const rootPackageJson = PackageJsonRawStub({
      name: '@acme/app',
      version: '1.0.0',
      workspaces: ['packages/*', 'packages/@gateway/*'],
      scripts: {
        postinstall:
          'if command -v dungeonmaster >/dev/null 2>&1; then dungeonmaster gateway-sync; fi',
      },
      dependencies: { 'left-pad': '^1.3.0' },
    });

    proxy.setupRootPackageJson({
      rootPackageJsonPath: '/repo/package.json',
      content: JSON.stringify(rootPackageJson),
    });

    for (const folder of ['npm', 'node', 'browser', 'bin']) {
      proxy.setupGatewayFolderExists({
        packageRoot: `/repo/packages/@gateway/${folder}`,
      });
    }

    proxy.setupNpmGatewaySync({
      repoRoot: '/repo',
      rootPackageJson,
      consumerFolders: [],
      passthroughFolders: ['left-pad'],
    });
    proxy.setupNpmGatewayLockfileFails({
      repoRoot: '/repo',
      output:
        "npm error code E404\nnpm error 404  '@dungeonmaster/siegelense@*' is not in this registry.\n",
    });

    proxy.setupRootTsconfig({
      rootTsconfigPath: '/repo/tsconfig.json',
      content: `{
  "compilerOptions": {
    "module": "node16",
    "moduleResolution": "node16",
    "customConditions": ["source"]
  }
}
`,
    });

    proxy.setupExistingPackages({
      packagesDir: '/repo/packages',
      packages: [],
    });

    const result = await InstallSetupGatewayResponder({
      context: InstallContextStub({
        value: { targetProjectRoot, dungeonmasterRoot: targetProjectRoot },
      }),
    });

    expect(result).toStrictEqual({
      packageName: '@dungeonmaster/cli',
      success: true,
      action: 'created',
      message:
        'workspaces already includes packages/@gateway/*; root postinstall script already runs gateway-sync; gateway packages already scaffolded; synced packages/@gateway/npm/src (generated: left-pad / untyped: left-pad / lockfile not updated: `npm install --ignore-scripts --no-audit --no-fund` exited 1 (npm error code E404); run npm install yourself to update package-lock.json); tsconfig.json already resolves node16; updated imports in 0 existing package(s); set gateway-dist in tsconfig.build.json of 0 existing package(s)',
    });
  });
});
