import {
  installTestbedCreateBroker,
  BaseNameStub,
  RelativePathStub,
  FileContentStub,
} from '@dungeonmaster/testing';
import { FilePathStub } from '@dungeonmaster/shared/contracts/file-path/file-path.stub';
import { InstallFlow } from './install-flow';
import { devDependenciesStatics } from '../../statics/dev-dependencies/dev-dependencies-statics';
import { playwrightConfigTemplateStatics } from '../../statics/playwright-config-template/playwright-config-template-statics';
import { jestConfigTemplateStatics } from '../../statics/jest-config-template/jest-config-template-statics';

describe('InstallFlow', () => {
  describe('add-dev-deps + create-playwright', () => {
    it('VALID: {context: no devDependencies, no playwright config, e2e-eligible target} => adds devDependencies and creates playwright.config.ts', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'flow-add-devdeps' }),
      });

      // create-playwright now gates on e2e eligibility — give this testbed the widgets+react
      // signals so the happy path still creates a config, same as before that gate existed.
      testbed.writeFile({
        relativePath: RelativePathStub({ value: 'package.json' }),
        content: FileContentStub({
          value: JSON.stringify(
            { name: 'test-project', version: '1.0.0', dependencies: { react: '18.2.0' } },
            null,
            2,
          ),
        }),
      });
      testbed.writeFile({
        relativePath: RelativePathStub({ value: 'src/widgets/placeholder.ts' }),
        content: FileContentStub({ value: 'export const Placeholder = {};\n' }),
      });

      const result = await InstallFlow({
        context: {
          targetProjectRoot: FilePathStub({ value: testbed.guildPath }),
          dungeonmasterRoot: FilePathStub({ value: testbed.dungeonmasterPath }),
        },
      });

      const packageJsonContent = testbed.readFile({
        relativePath: RelativePathStub({ value: 'package.json' }),
      });
      const playwrightConfigContent = testbed.readFile({
        relativePath: RelativePathStub({ value: 'playwright.config.ts' }),
      });
      const jestConfigContent = testbed.readFile({
        relativePath: RelativePathStub({ value: 'jest.config.js' }),
      });

      testbed.cleanup();

      expect(result).toStrictEqual({
        packageName: '@dungeonmaster/cli',
        success: true,
        action: 'created',
        message:
          'Added devDependencies to package.json; Created playwright.config.ts; Created tsconfig.json; Created jest.config.js; added packages/@gateway/* to workspaces; scaffolded gateway packages: npm, node, browser, bin; tsconfig.json already resolves node16; updated imports in 0 existing package(s); set gateway-dist in tsconfig.build.json of 0 existing package(s)',
      });
      expect(packageJsonContent).toMatch(/^\s*"devDependencies": \{$/mu);
      expect(packageJsonContent).toMatch(/^\s*"typescript": "\^5\.8\.3"$/mu);
      expect(packageJsonContent).toMatch(/^\s*"@playwright\/test": "\^1\.58\.2",$/mu);
      expect(playwrightConfigContent).toBe(playwrightConfigTemplateStatics.content);
      expect(jestConfigContent).toBe(jestConfigTemplateStatics.content);
    });

    it('VALID: {context: all devDependencies present, e2e-eligible target, playwright config exists} => skips those four steps without overwriting, though the gateway step still scaffolds on a bare testbed', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'flow-skip-devdeps' }),
      });

      // e2e-eligible (widgets+react) so the skip below is actually exercising "config already
      // exists", not the eligibility gate short-circuiting first with a different message.
      testbed.writeFile({
        relativePath: RelativePathStub({ value: 'package.json' }),
        content: FileContentStub({
          value: JSON.stringify(
            {
              name: 'test-project',
              version: '1.0.0',
              dependencies: { react: '18.2.0' },
              devDependencies: { ...devDependenciesStatics.packages },
            },
            null,
            2,
          ),
        }),
      });
      testbed.writeFile({
        relativePath: RelativePathStub({ value: 'src/widgets/placeholder.ts' }),
        content: FileContentStub({ value: 'export const Placeholder = {};\n' }),
      });
      testbed.writeFile({
        relativePath: RelativePathStub({ value: 'playwright.config.ts' }),
        content: FileContentStub({ value: '// existing user config\n' }),
      });
      testbed.writeFile({
        relativePath: RelativePathStub({ value: 'tsconfig.json' }),
        content: FileContentStub({ value: '{}\n' }),
      });
      testbed.writeFile({
        relativePath: RelativePathStub({ value: 'jest.config.js' }),
        content: FileContentStub({ value: '// existing jest config\n' }),
      });

      const result = await InstallFlow({
        context: {
          targetProjectRoot: FilePathStub({ value: testbed.guildPath }),
          dungeonmasterRoot: FilePathStub({ value: testbed.dungeonmasterPath }),
        },
      });

      const playwrightConfigContent = testbed.readFile({
        relativePath: RelativePathStub({ value: 'playwright.config.ts' }),
      });

      testbed.cleanup();

      expect(result).toStrictEqual({
        packageName: '@dungeonmaster/cli',
        success: true,
        action: 'created',
        message:
          'All devDependencies already present; playwright.config.ts already exists; tsconfig.json already exists; jest.config.js already exists; added packages/@gateway/* to workspaces; scaffolded gateway packages: npm, node, browser, bin; tsconfig.json already resolves node16; updated imports in 0 existing package(s); set gateway-dist in tsconfig.build.json of 0 existing package(s)',
      });
      expect(playwrightConfigContent).toBe('// existing user config\n');
    });

    it('VALID: {context: target has no widgets/react or ink signals} => skips playwright.config.ts without writing it', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'flow-not-e2e-eligible' }),
      });
      // No src/widgets, no react dependency — installTestbedCreateBroker's default package.json
      // (name + version only) already represents a non-eligible target.

      const result = await InstallFlow({
        context: {
          targetProjectRoot: FilePathStub({ value: testbed.guildPath }),
          dungeonmasterRoot: FilePathStub({ value: testbed.dungeonmasterPath }),
        },
      });

      const playwrightConfigContent = testbed.readFile({
        relativePath: RelativePathStub({ value: 'playwright.config.ts' }),
      });

      testbed.cleanup();

      expect(result).toStrictEqual({
        packageName: '@dungeonmaster/cli',
        success: true,
        action: 'created',
        message:
          'Added devDependencies to package.json; target project is not e2e-eligible (packageType is not frontend-react or frontend-ink); Created tsconfig.json; Created jest.config.js; added packages/@gateway/* to workspaces; scaffolded gateway packages: npm, node, browser, bin; tsconfig.json already resolves node16; updated imports in 0 existing package(s); set gateway-dist in tsconfig.build.json of 0 existing package(s)',
      });
      expect(playwrightConfigContent).toBe(null);
    });

    it('VALID: {context: target has npm workspaces} => skips jest.config.js without writing it', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'flow-workspaces-root' }),
      });
      testbed.writeFile({
        relativePath: RelativePathStub({ value: 'package.json' }),
        content: FileContentStub({
          value: JSON.stringify(
            { name: 'monorepo-root', version: '1.0.0', workspaces: ['packages/*'] },
            null,
            2,
          ),
        }),
      });

      const result = await InstallFlow({
        context: {
          targetProjectRoot: FilePathStub({ value: testbed.guildPath }),
          dungeonmasterRoot: FilePathStub({ value: testbed.dungeonmasterPath }),
        },
      });

      const jestConfigContent = testbed.readFile({
        relativePath: RelativePathStub({ value: 'jest.config.js' }),
      });

      testbed.cleanup();

      expect(result).toStrictEqual({
        packageName: '@dungeonmaster/cli',
        success: true,
        action: 'created',
        message:
          'Added devDependencies to package.json; target project is not e2e-eligible (packageType is not frontend-react or frontend-ink); Created tsconfig.json; target project has npm workspaces (each package owns its own jest.config.js); added packages/@gateway/* to workspaces; scaffolded gateway packages: npm, node, browser, bin; tsconfig.json already resolves node16; updated imports in 0 existing package(s); set gateway-dist in tsconfig.build.json of 0 existing package(s)',
      });
      expect(jestConfigContent).toBe(null);
    });
  });

  describe('setup-gateway', () => {
    it('VALID: {scoped root name, two packages — one with a build config and its own paths, one with an existing imports entry} => scaffolds the four gateway packages, wires every package in, and a second run changes nothing', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'flow-gateway-scoped' }),
      });

      testbed.writeFile({
        relativePath: RelativePathStub({ value: 'package.json' }),
        content: FileContentStub({
          value: JSON.stringify(
            { name: '@acme/app', version: '1.0.0', workspaces: ['packages/*'] },
            null,
            2,
          ),
        }),
      });
      testbed.writeFile({
        relativePath: RelativePathStub({ value: 'packages/pkg-a/package.json' }),
        content: FileContentStub({
          value: JSON.stringify({ name: '@acme/pkg-a', version: '1.0.0' }, null, 2),
        }),
      });
      testbed.writeFile({
        relativePath: RelativePathStub({ value: 'packages/pkg-a/tsconfig.json' }),
        content: FileContentStub({
          value: JSON.stringify(
            {
              extends: '../../tsconfig.json',
              compilerOptions: { paths: { '#alias/*': ['./src/*'] } },
            },
            null,
            2,
          ),
        }),
      });
      testbed.writeFile({
        relativePath: RelativePathStub({ value: 'packages/pkg-a/tsconfig.build.json' }),
        content: FileContentStub({
          value: JSON.stringify(
            { extends: './tsconfig.json', compilerOptions: { outDir: './dist' } },
            null,
            2,
          ),
        }),
      });
      testbed.writeFile({
        relativePath: RelativePathStub({ value: 'packages/pkg-b/package.json' }),
        content: FileContentStub({
          value: JSON.stringify(
            {
              name: '@acme/pkg-b',
              version: '1.0.0',
              imports: { '#custom/*': './other/*' },
            },
            null,
            2,
          ),
        }),
      });
      testbed.writeFile({
        relativePath: RelativePathStub({ value: 'packages/pkg-b/tsconfig.json' }),
        content: FileContentStub({
          value: JSON.stringify({ extends: '../../tsconfig.json' }, null, 2),
        }),
      });

      const firstRun = await InstallFlow({
        context: {
          targetProjectRoot: FilePathStub({ value: testbed.guildPath }),
          dungeonmasterRoot: FilePathStub({ value: testbed.dungeonmasterPath }),
        },
      });

      expect(firstRun.action).toBe('created');

      const rootPackageJson = JSON.parse(
        String(testbed.readFile({ relativePath: RelativePathStub({ value: 'package.json' }) })),
      );

      expect(rootPackageJson).toStrictEqual({
        name: '@acme/app',
        version: '1.0.0',
        workspaces: ['packages/*', 'packages/@gateway/*'],
        devDependencies: devDependenciesStatics.packages,
      });

      const npmPackageJson = JSON.parse(
        String(
          testbed.readFile({
            relativePath: RelativePathStub({ value: 'packages/@gateway/npm/package.json' }),
          }),
        ),
      );

      expect(npmPackageJson).toStrictEqual({
        name: '@acme/npm',
        version: '0.1.0',
        description:
          'Gateway package: one subpath per third-party npm package our code imports, named for it',
        sideEffects: false,
        imports: {
          '#gateway/npm/*': '@acme/npm/*',
          '#gateway/node/*': '@acme/node/*',
          '#gateway/browser/*': '@acme/browser/*',
          '#gateway/bin/*': '@acme/bin/*',
        },
        exports: {
          './package.json': './package.json',
          './*.proxy': {
            'npm-own-source': './src/*.proxy.ts',
            'gateway-dist': './dist/*.proxy.d.ts',
            source: './src/*.proxy.ts',
            import: './dist/*.proxy.js',
            require: './dist/*.proxy.js',
            types: './dist/*.proxy.d.ts',
          },
          './*.stub': {
            'npm-own-source': './src/*.stub.ts',
            'gateway-dist': './dist/*.stub.d.ts',
            source: './src/*.stub.ts',
            import: './dist/*.stub.js',
            require: './dist/*.stub.js',
            types: './dist/*.stub.d.ts',
          },
          './*': {
            'npm-own-source': './src/*/*.ts',
            'gateway-dist': './dist/*/*.d.ts',
            source: './src/*/*.ts',
            import: './dist/*/*.js',
            require: './dist/*/*.js',
            types: './dist/*/*.d.ts',
          },
        },
        files: ['dist'],
        scripts: {
          build: 'tsc -p tsconfig.build.json',
          'build:clean': 'rm -rf dist .ward/build.tsbuildinfo && npm run build',
          test: 'dungeonmaster-ward --only test',
          typecheck: 'dungeonmaster-ward --only typecheck',
          lint: 'dungeonmaster-ward --only lint',
          ward: 'dungeonmaster-ward',
        },
        devDependencies: {
          '@types/node': '^24.0.15',
          typescript: '^5.8.3',
        },
        publishConfig: { access: 'public' },
      });
      expect(
        testbed.readFile({
          relativePath: RelativePathStub({ value: 'packages/@gateway/npm/src/index.d.ts' }),
        }),
      )
        .toBe(`// Keeps this package compiling while it holds no subpath: tsc refuses a config that matches no
// file. Delete it once the first src/<subpath>/<subpath>.ts exists.
export {};
`);

      // node and browser arrive holding dungeonmaster's own source, copied from the installed
      // packages: a wrapper folder with its companions. Browser's jsdom polyfill is a
      // @dungeonmaster/testing import, not a copied file, so no __mocks__ directory ships.
      expect(
        testbed.listDir({
          relativePath: RelativePathStub({
            value: 'packages/@gateway/node/src/fs__promises/copy-dir-contents-entries-recurse',
          }),
        }),
      ).toStrictEqual([
        'copy-dir-contents-entries-recurse.proxy.ts',
        'copy-dir-contents-entries-recurse.test.ts',
        'copy-dir-contents-entries-recurse.ts',
      ]);
      expect(
        testbed.listDir({
          relativePath: RelativePathStub({ value: 'packages/@gateway/browser/__mocks__' }),
        }),
      ).toBe(null);
      expect(
        testbed.listDir({
          relativePath: RelativePathStub({ value: 'packages/@gateway/bin/src' }),
        }),
      ).toStrictEqual(['index.d.ts']);

      // Every folder was scaffolded, named for the repo's own scope — a substring check on the raw
      // text (not a JSON.parse + property access) since only the name needs proving here, the full
      // shape already having been proven above for npm.
      for (const folder of ['node', 'browser', 'bin']) {
        const packageJsonContent = String(
          testbed.readFile({
            relativePath: RelativePathStub({ value: `packages/@gateway/${folder}/package.json` }),
          }),
        );

        expect(packageJsonContent).toMatch(new RegExp(`"name": "@acme/${folder}"`, 'u'));
      }

      const rootTsconfig = JSON.parse(
        String(testbed.readFile({ relativePath: RelativePathStub({ value: 'tsconfig.json' }) })),
      );

      expect(rootTsconfig).toStrictEqual({
        extends: '@dungeonmaster/eslint-plugin/tsconfig',
        compilerOptions: {
          noEmit: true,
          module: 'node16',
          moduleResolution: 'node16',
          customConditions: ['source'],
          typeRoots: ['./node_modules/@types', './@types'],
        },
        files: [],
      });

      const pkgAPackageJson = JSON.parse(
        String(
          testbed.readFile({
            relativePath: RelativePathStub({ value: 'packages/pkg-a/package.json' }),
          }),
        ),
      );

      expect(pkgAPackageJson).toStrictEqual({
        name: '@acme/pkg-a',
        version: '1.0.0',
        imports: {
          '#gateway/npm/*': '@acme/npm/*',
          '#gateway/node/*': '@acme/node/*',
          '#gateway/browser/*': '@acme/browser/*',
          '#gateway/bin/*': '@acme/bin/*',
        },
      });

      const pkgATsconfig = JSON.parse(
        String(
          testbed.readFile({
            relativePath: RelativePathStub({ value: 'packages/pkg-a/tsconfig.json' }),
          }),
        ),
      );

      expect(pkgATsconfig).toStrictEqual({
        extends: '../../tsconfig.json',
        compilerOptions: {
          paths: { '#alias/*': ['./src/*'] },
        },
      });

      const pkgATsconfigBuild = JSON.parse(
        String(
          testbed.readFile({
            relativePath: RelativePathStub({ value: 'packages/pkg-a/tsconfig.build.json' }),
          }),
        ),
      );

      expect(pkgATsconfigBuild).toStrictEqual({
        extends: './tsconfig.json',
        compilerOptions: {
          outDir: './dist',
          customConditions: ['gateway-dist', 'source'],
        },
      });

      const pkgBPackageJson = JSON.parse(
        String(
          testbed.readFile({
            relativePath: RelativePathStub({ value: 'packages/pkg-b/package.json' }),
          }),
        ),
      );

      expect(pkgBPackageJson).toStrictEqual({
        name: '@acme/pkg-b',
        version: '1.0.0',
        imports: {
          '#custom/*': './other/*',
          '#gateway/npm/*': '@acme/npm/*',
          '#gateway/node/*': '@acme/node/*',
          '#gateway/browser/*': '@acme/browser/*',
          '#gateway/bin/*': '@acme/bin/*',
        },
      });

      // A package's own tsconfig.json is never touched: it inherits node16 resolution from the root
      // via `extends`. Only a tsconfig.build.json gets the gateway-dist condition.
      const pkgBTsconfigBefore = String(
        testbed.readFile({
          relativePath: RelativePathStub({ value: 'packages/pkg-b/tsconfig.json' }),
        }),
      );

      expect(JSON.parse(pkgBTsconfigBefore)).toStrictEqual({ extends: '../../tsconfig.json' });

      // Capture every gateway-touched file's exact bytes, then run again and assert none of them
      // changed even by a single byte.
      const filesToCompare = [
        RelativePathStub({ value: 'package.json' }),
        RelativePathStub({ value: 'tsconfig.json' }),
        RelativePathStub({ value: 'packages/@gateway/npm/package.json' }),
        RelativePathStub({ value: 'packages/@gateway/npm/tsconfig.json' }),
        RelativePathStub({ value: 'packages/@gateway/npm/tsconfig.build.json' }),
        RelativePathStub({ value: 'packages/@gateway/node/src/fs/fs.ts' }),
        RelativePathStub({ value: 'packages/pkg-a/package.json' }),
        RelativePathStub({ value: 'packages/pkg-a/tsconfig.json' }),
        RelativePathStub({ value: 'packages/pkg-a/tsconfig.build.json' }),
        RelativePathStub({ value: 'packages/pkg-b/package.json' }),
        RelativePathStub({ value: 'packages/pkg-b/tsconfig.json' }),
      ];
      const beforeSecondRun = filesToCompare.map((relativePath) =>
        String(testbed.readFile({ relativePath })),
      );

      const secondRun = await InstallFlow({
        context: {
          targetProjectRoot: FilePathStub({ value: testbed.guildPath }),
          dungeonmasterRoot: FilePathStub({ value: testbed.dungeonmasterPath }),
        },
      });

      const afterSecondRun = filesToCompare.map((relativePath) =>
        String(testbed.readFile({ relativePath })),
      );

      testbed.cleanup();

      expect(secondRun.action).toBe('skipped');
      expect(afterSecondRun).toStrictEqual(beforeSecondRun);
    });

    it('VALID: {unscoped root name} => names the gateway packages from a scope built off that name', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'flow-gateway-unscoped' }),
      });

      testbed.writeFile({
        relativePath: RelativePathStub({ value: 'package.json' }),
        content: FileContentStub({
          value: JSON.stringify({ name: 'my-app', version: '1.0.0' }, null, 2),
        }),
      });

      const result = await InstallFlow({
        context: {
          targetProjectRoot: FilePathStub({ value: testbed.guildPath }),
          dungeonmasterRoot: FilePathStub({ value: testbed.dungeonmasterPath }),
        },
      });

      const npmPackageJson = JSON.parse(
        String(
          testbed.readFile({
            relativePath: RelativePathStub({ value: 'packages/@gateway/npm/package.json' }),
          }),
        ),
      );

      testbed.cleanup();

      expect(result.action).toBe('created');
      expect(npmPackageJson).toStrictEqual({
        name: '@my-app/npm',
        version: '0.1.0',
        description:
          'Gateway package: one subpath per third-party npm package our code imports, named for it',
        sideEffects: false,
        imports: {
          '#gateway/npm/*': '@my-app/npm/*',
          '#gateway/node/*': '@my-app/node/*',
          '#gateway/browser/*': '@my-app/browser/*',
          '#gateway/bin/*': '@my-app/bin/*',
        },
        exports: {
          './package.json': './package.json',
          './*.proxy': {
            'npm-own-source': './src/*.proxy.ts',
            'gateway-dist': './dist/*.proxy.d.ts',
            source: './src/*.proxy.ts',
            import: './dist/*.proxy.js',
            require: './dist/*.proxy.js',
            types: './dist/*.proxy.d.ts',
          },
          './*.stub': {
            'npm-own-source': './src/*.stub.ts',
            'gateway-dist': './dist/*.stub.d.ts',
            source: './src/*.stub.ts',
            import: './dist/*.stub.js',
            require: './dist/*.stub.js',
            types: './dist/*.stub.d.ts',
          },
          './*': {
            'npm-own-source': './src/*/*.ts',
            'gateway-dist': './dist/*/*.d.ts',
            source: './src/*/*.ts',
            import: './dist/*/*.js',
            require: './dist/*/*.js',
            types: './dist/*/*.d.ts',
          },
        },
        files: ['dist'],
        scripts: {
          build: 'tsc -p tsconfig.build.json',
          'build:clean': 'rm -rf dist .ward/build.tsbuildinfo && npm run build',
          test: 'dungeonmaster-ward --only test',
          typecheck: 'dungeonmaster-ward --only typecheck',
          lint: 'dungeonmaster-ward --only lint',
          ward: 'dungeonmaster-ward',
        },
        devDependencies: {
          '@types/node': '^24.0.15',
          typescript: '^5.8.3',
        },
        publishConfig: { access: 'public' },
      });
    });
  });
});
