import { FilePathStub, FileNameStub } from '@dungeonmaster/shared/contracts';
import { InstallSetupGatewayResponder } from './install-setup-gateway-responder';
import { InstallSetupGatewayResponderProxy } from './install-setup-gateway-responder.proxy';

describe('InstallSetupGatewayResponder', () => {
  it('EMPTY: {context: no package.json} => returns skipped without touching anything else', async () => {
    const proxy = InstallSetupGatewayResponderProxy();
    const targetProjectRoot = FilePathStub({ value: '/repo' });
    proxy.setupNoRootPackageJson({
      rootPackageJsonPath: FilePathStub({ value: '/repo/package.json' }),
    });

    const result = await InstallSetupGatewayResponder({
      context: { targetProjectRoot, dungeonmasterRoot: targetProjectRoot },
    });

    expect(result).toStrictEqual({
      packageName: '@dungeonmaster/cli',
      success: false,
      action: 'skipped',
      message: 'No package.json found',
    });
  });

  it('VALID: {context: workspaces, gateway folders, root tsconfig paths, and one package all already in place} => returns skipped without writing anything', async () => {
    const proxy = InstallSetupGatewayResponderProxy();
    const targetProjectRoot = FilePathStub({ value: '/repo' });

    proxy.setupRootPackageJson({
      rootPackageJsonPath: FilePathStub({ value: '/repo/package.json' }),
      content: JSON.stringify({
        name: '@acme/app',
        version: '1.0.0',
        workspaces: ['packages/*', 'packages/@gateway/*'],
      }),
    });

    for (const folder of ['npm', 'node', 'browser', 'bin']) {
      proxy.setupGatewayFolderExists({
        packageRoot: FilePathStub({ value: `/repo/packages/@gateway/${folder}` }),
      });
    }

    proxy.setupRootTsconfig({
      rootTsconfigPath: FilePathStub({ value: '/repo/tsconfig.json' }),
      content: `{
  "compilerOptions": {
    "paths": {
      "#gateway/npm/*": ["./packages/@gateway/npm/src/*/index.ts", "./packages/@gateway/npm/src/*"],
      "#gateway/node/*": ["./packages/@gateway/node/src/*/index.ts", "./packages/@gateway/node/src/*"],
      "#gateway/browser/*": ["./packages/@gateway/browser/src/*/index.ts", "./packages/@gateway/browser/src/*"],
      "#gateway/bin/*": ["./packages/@gateway/bin/src/*/index.ts", "./packages/@gateway/bin/src/*"]
    }
  }
}
`,
    });

    proxy.setupExistingPackages({
      packagesDir: FilePathStub({ value: '/repo/packages' }),
      packages: [{ name: FileNameStub({ value: 'app' }), hasPackageJson: true }],
    });

    proxy.setupPackageJson({
      packageJsonPath: FilePathStub({ value: '/repo/packages/app/package.json' }),
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
      tsconfigPath: FilePathStub({ value: '/repo/packages/app/tsconfig.json' }),
      content: `{
  "compilerOptions": {
    "noEmit": true
  }
}
`,
    });

    proxy.setupPackageTsconfigBuildMissing({
      tsconfigBuildPath: FilePathStub({ value: '/repo/packages/app/tsconfig.build.json' }),
    });

    const result = await InstallSetupGatewayResponder({
      context: { targetProjectRoot, dungeonmasterRoot: targetProjectRoot },
    });

    expect(result).toStrictEqual({
      packageName: '@dungeonmaster/cli',
      success: true,
      action: 'skipped',
      message:
        'workspaces already includes packages/@gateway/*; gateway packages already scaffolded; tsconfig.json gateway paths already present; updated imports in 0 existing package(s); updated tsconfig.json paths in 0 existing package(s); updated tsconfig.build.json paths in 0 existing package(s)',
    });
    expect(proxy.getWrittenFiles()).toStrictEqual([]);
  });

  it('EMPTY: {context: root tsconfig.json missing, everything else already in place} => reports it by name instead of claiming the paths are already present', async () => {
    const proxy = InstallSetupGatewayResponderProxy();
    const targetProjectRoot = FilePathStub({ value: '/repo' });

    proxy.setupRootPackageJson({
      rootPackageJsonPath: FilePathStub({ value: '/repo/package.json' }),
      content: JSON.stringify({
        name: '@acme/app',
        version: '1.0.0',
        workspaces: ['packages/*', 'packages/@gateway/*'],
      }),
    });

    for (const folder of ['npm', 'node', 'browser', 'bin']) {
      proxy.setupGatewayFolderExists({
        packageRoot: FilePathStub({ value: `/repo/packages/@gateway/${folder}` }),
      });
    }

    proxy.setupRootTsconfigMissing({
      rootTsconfigPath: FilePathStub({ value: '/repo/tsconfig.json' }),
    });

    proxy.setupExistingPackages({
      packagesDir: FilePathStub({ value: '/repo/packages' }),
      packages: [],
    });

    const result = await InstallSetupGatewayResponder({
      context: { targetProjectRoot, dungeonmasterRoot: targetProjectRoot },
    });

    expect(result).toStrictEqual({
      packageName: '@dungeonmaster/cli',
      success: true,
      action: 'skipped',
      message:
        'workspaces already includes packages/@gateway/*; gateway packages already scaffolded; no tsconfig.json found to add gateway paths to; updated imports in 0 existing package(s); updated tsconfig.json paths in 0 existing package(s); updated tsconfig.build.json paths in 0 existing package(s)',
    });
    expect(proxy.getWrittenFiles()).toStrictEqual([]);
  });
});
