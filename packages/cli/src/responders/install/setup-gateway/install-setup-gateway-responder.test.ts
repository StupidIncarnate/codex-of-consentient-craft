import { FilePathStub } from '@dungeonmaster/shared/contracts/file-path/file-path.stub';
import { FileNameStub } from '@dungeonmaster/shared/contracts/file-name/file-name.stub';
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

  it('VALID: {context: workspaces, gateway folders, root tsconfig node16, and one package all already in place} => returns skipped without writing anything', async () => {
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
    "module": "node16",
    "moduleResolution": "node16",
    "customConditions": ["source"]
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
        'workspaces already includes packages/@gateway/*; gateway packages already scaffolded; tsconfig.json already resolves node16; updated imports in 0 existing package(s); set gateway-dist in tsconfig.build.json of 0 existing package(s)',
    });
    expect(proxy.getWrittenFiles()).toStrictEqual([]);
  });

  it('EMPTY: {context: root tsconfig.json missing, everything else already in place} => reports it by name instead of claiming it already resolves node16', async () => {
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
        'workspaces already includes packages/@gateway/*; gateway packages already scaffolded; no tsconfig.json found to set node16 resolution in; updated imports in 0 existing package(s); set gateway-dist in tsconfig.build.json of 0 existing package(s)',
    });
    expect(proxy.getWrittenFiles()).toStrictEqual([]);
  });

  it('VALID: {context: root tsconfig on commonjs, one package with a build config} => sets node16 in the root and gateway-dist in the build config', async () => {
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
    "module": "commonjs"
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
      tsconfigPath: FilePathStub({ value: '/repo/packages/app/tsconfig.build.json' }),
      content: `{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "outDir": "./dist"
  }
}
`,
    });

    const result = await InstallSetupGatewayResponder({
      context: { targetProjectRoot, dungeonmasterRoot: targetProjectRoot },
    });

    expect(result).toStrictEqual({
      packageName: '@dungeonmaster/cli',
      success: true,
      action: 'created',
      message:
        'workspaces already includes packages/@gateway/*; gateway packages already scaffolded; set node16 resolution in tsconfig.json; updated imports in 0 existing package(s); set gateway-dist in tsconfig.build.json of 1 existing package(s)',
    });
    expect(proxy.getWrittenFiles()).toStrictEqual([
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
});
