import { npmCommandFakeHarness } from '../../../test/harnesses/npm-command-fake/npm-command-fake.harness';
import { installTestbedCreateBroker } from '@dungeonmaster/testing';
import { InstallFlow } from './install-flow';
import { devDependenciesStatics } from '../../statics/dev-dependencies/dev-dependencies-statics';
import { playwrightConfigTemplateStatics } from '../../statics/playwright-config-template/playwright-config-template-statics';
import { jestConfigTemplateStatics } from '../../statics/jest-config-template/jest-config-template-statics';
import { InstallContextStub } from '@dungeonmaster/shared/contracts/install-context/install-context.stub';

describe('InstallFlow', () => {
  // A `dependencies` entry makes init's npm-gateway sync record it in the gateway package and run
  // `npm install --ignore-scripts`; the fake keeps that off the network.
  const npmFake = npmCommandFakeHarness();

  describe('add-dev-deps + create-playwright', () => {
    it('VALID: {context: no devDependencies, no playwright config, e2e-eligible target} => adds devDependencies and creates playwright.config.ts', async () => {
      npmFake.stageSucceeds();
      const testbed = installTestbedCreateBroker({
        baseName: 'flow-add-devdeps',
      });

      // create-playwright now gates on e2e eligibility — give this testbed the widgets+react
      // signals so the happy path still creates a config, same as before that gate existed.
      testbed.writeFile({
        relativePath: 'package.json',
        content: JSON.stringify(
          { name: 'test-project', version: '1.0.0', dependencies: { react: '18.2.0' } },
          null,
          2,
        ),
      });
      testbed.writeFile({
        relativePath: 'src/widgets/placeholder.ts',
        content: 'export const Placeholder = {};\n',
      });

      const result = await InstallFlow({
        context: InstallContextStub({
          value: {
            targetProjectRoot: testbed.guildPath,
            dungeonmasterRoot: testbed.dungeonmasterPath,
          },
        }),
      });

      const packageJsonContent = testbed.readFile({
        relativePath: 'package.json',
      });
      const playwrightConfigContent = testbed.readFile({
        relativePath: 'playwright.config.ts',
      });
      const jestConfigContent = testbed.readFile({
        relativePath: 'jest.config.js',
      });

      testbed.cleanup();

      expect(result).toStrictEqual({
        packageName: '@dungeonmaster/cli',
        success: true,
        action: 'created',
        message:
          'Added devDependencies to package.json; Created playwright.config.ts; Created tsconfig.json; Created jest.config.js; added packages/@gateway/* to workspaces; set the root postinstall script to run dungeonmaster gateway-sync; scaffolded gateway packages: npm, node, browser, bin; synced packages/@gateway/npm/src (generated: react / untyped: react / passthrough instead of our wrapper: react (not installed, ours ^19.0.0)); tsconfig.json already resolves node16; updated imports in 0 existing package(s); set gateway-dist in tsconfig.build.json of 0 existing package(s)',
      });
      expect(packageJsonContent).toMatch(/^\s*"devDependencies": \{$/mu);
      expect(packageJsonContent).toMatch(/^\s*"typescript": "\^5\.8\.3"$/mu);
      expect(packageJsonContent).toMatch(/^\s*"@playwright\/test": "\^1\.58\.2",$/mu);
      expect(playwrightConfigContent).toBe(playwrightConfigTemplateStatics.content);
      expect(jestConfigContent).toBe(jestConfigTemplateStatics.content);
    });

    it('VALID: {context: all devDependencies present, e2e-eligible target, playwright config exists} => skips those four steps without overwriting, though the gateway step still scaffolds on a bare testbed', async () => {
      npmFake.stageSucceeds();
      const testbed = installTestbedCreateBroker({
        baseName: 'flow-skip-devdeps',
      });

      // e2e-eligible (widgets+react) so the skip below is actually exercising "config already
      // exists", not the eligibility gate short-circuiting first with a different message.
      testbed.writeFile({
        relativePath: 'package.json',
        content: JSON.stringify(
          {
            name: 'test-project',
            version: '1.0.0',
            dependencies: { react: '18.2.0' },
            devDependencies: { ...devDependenciesStatics.packages },
          },
          null,
          2,
        ),
      });
      testbed.writeFile({
        relativePath: 'src/widgets/placeholder.ts',
        content: 'export const Placeholder = {};\n',
      });
      testbed.writeFile({
        relativePath: 'playwright.config.ts',
        content: '// existing user config\n',
      });
      testbed.writeFile({
        relativePath: 'tsconfig.json',
        content: '{}\n',
      });
      testbed.writeFile({
        relativePath: 'jest.config.js',
        content: '// existing jest config\n',
      });

      const result = await InstallFlow({
        context: InstallContextStub({
          value: {
            targetProjectRoot: testbed.guildPath,
            dungeonmasterRoot: testbed.dungeonmasterPath,
          },
        }),
      });

      const playwrightConfigContent = testbed.readFile({
        relativePath: 'playwright.config.ts',
      });

      testbed.cleanup();

      expect(result).toStrictEqual({
        packageName: '@dungeonmaster/cli',
        success: true,
        action: 'created',
        message:
          'All devDependencies already present; playwright.config.ts already exists; tsconfig.json already exists; jest.config.js already exists; added packages/@gateway/* to workspaces; set the root postinstall script to run dungeonmaster gateway-sync; scaffolded gateway packages: npm, node, browser, bin; synced packages/@gateway/npm/src (generated: react / untyped: react / passthrough instead of our wrapper: react (not installed, ours ^19.0.0)); tsconfig.json already resolves node16; updated imports in 0 existing package(s); set gateway-dist in tsconfig.build.json of 0 existing package(s)',
      });
      expect(playwrightConfigContent).toBe('// existing user config\n');
    });

    it('VALID: {context: target has no widgets/react or ink signals} => skips playwright.config.ts without writing it', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: 'flow-not-e2e-eligible',
      });
      // No src/widgets, no react dependency — installTestbedCreateBroker's default package.json
      // (name + version only) already represents a non-eligible target.

      const result = await InstallFlow({
        context: InstallContextStub({
          value: {
            targetProjectRoot: testbed.guildPath,
            dungeonmasterRoot: testbed.dungeonmasterPath,
          },
        }),
      });

      const playwrightConfigContent = testbed.readFile({
        relativePath: 'playwright.config.ts',
      });

      testbed.cleanup();

      expect(result).toStrictEqual({
        packageName: '@dungeonmaster/cli',
        success: true,
        action: 'created',
        message:
          'Added devDependencies to package.json; target project is not e2e-eligible (packageType is not frontend-react or frontend-ink); Created tsconfig.json; Created jest.config.js; added packages/@gateway/* to workspaces; set the root postinstall script to run dungeonmaster gateway-sync; scaffolded gateway packages: npm, node, browser, bin; packages/@gateway/npm/src already has a folder for every dependency; tsconfig.json already resolves node16; updated imports in 0 existing package(s); set gateway-dist in tsconfig.build.json of 0 existing package(s)',
      });
      expect(playwrightConfigContent).toBe(null);
    });

    it('VALID: {context: target has npm workspaces} => skips jest.config.js without writing it', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: 'flow-workspaces-root',
      });
      testbed.writeFile({
        relativePath: 'package.json',
        content: JSON.stringify(
          { name: 'monorepo-root', version: '1.0.0', workspaces: ['packages/*'] },
          null,
          2,
        ),
      });

      const result = await InstallFlow({
        context: InstallContextStub({
          value: {
            targetProjectRoot: testbed.guildPath,
            dungeonmasterRoot: testbed.dungeonmasterPath,
          },
        }),
      });

      const jestConfigContent = testbed.readFile({
        relativePath: 'jest.config.js',
      });

      testbed.cleanup();

      expect(result).toStrictEqual({
        packageName: '@dungeonmaster/cli',
        success: true,
        action: 'created',
        message:
          'Added devDependencies to package.json; target project is not e2e-eligible (packageType is not frontend-react or frontend-ink); Created tsconfig.json; target project has npm workspaces (each package owns its own jest.config.js); added packages/@gateway/* to workspaces; set the root postinstall script to run dungeonmaster gateway-sync; scaffolded gateway packages: npm, node, browser, bin; packages/@gateway/npm/src already has a folder for every dependency; tsconfig.json already resolves node16; updated imports in 0 existing package(s); set gateway-dist in tsconfig.build.json of 0 existing package(s)',
      });
      expect(jestConfigContent).toBe(null);
    });
  });

  describe('setup-gateway', () => {
    it('VALID: {scoped root name, two packages — one with a build config and its own paths, one with an existing imports entry} => scaffolds the four gateway packages, wires every package in, and a second run changes nothing', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: 'flow-gateway-scoped',
      });

      testbed.writeFile({
        relativePath: 'package.json',
        content: JSON.stringify(
          { name: '@acme/app', version: '1.0.0', workspaces: ['packages/*'] },
          null,
          2,
        ),
      });
      testbed.writeFile({
        relativePath: 'packages/pkg-a/package.json',
        content: JSON.stringify({ name: '@acme/pkg-a', version: '1.0.0' }, null, 2),
      });
      testbed.writeFile({
        relativePath: 'packages/pkg-a/tsconfig.json',
        content: JSON.stringify(
          {
            extends: '../../tsconfig.json',
            compilerOptions: { paths: { '#alias/*': ['./src/*'] } },
          },
          null,
          2,
        ),
      });
      testbed.writeFile({
        relativePath: 'packages/pkg-a/tsconfig.build.json',
        content: JSON.stringify(
          { extends: './tsconfig.json', compilerOptions: { outDir: './dist' } },
          null,
          2,
        ),
      });
      testbed.writeFile({
        relativePath: 'packages/pkg-b/package.json',
        content: JSON.stringify(
          {
            name: '@acme/pkg-b',
            version: '1.0.0',
            imports: { '#custom/*': './other/*' },
          },
          null,
          2,
        ),
      });
      testbed.writeFile({
        relativePath: 'packages/pkg-b/tsconfig.json',
        content: JSON.stringify({ extends: '../../tsconfig.json' }, null, 2),
      });

      const firstRun = await InstallFlow({
        context: InstallContextStub({
          value: {
            targetProjectRoot: testbed.guildPath,
            dungeonmasterRoot: testbed.dungeonmasterPath,
          },
        }),
      });

      expect(firstRun.action).toBe('created');

      const rootPackageJson = JSON.parse(
        String(testbed.readFile({ relativePath: 'package.json' })),
      );

      expect(rootPackageJson).toStrictEqual({
        name: '@acme/app',
        version: '1.0.0',
        workspaces: ['packages/*', 'packages/@gateway/*'],
        devDependencies: devDependenciesStatics.packages,
        scripts: {
          postinstall:
            'if command -v dungeonmaster >/dev/null 2>&1; then dungeonmaster gateway-sync; fi',
        },
      });

      const npmPackageJson = JSON.parse(
        String(
          testbed.readFile({
            relativePath: 'packages/@gateway/npm/package.json',
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
            'gateway-source': './src/*.proxy.ts',
            source: './src/*.proxy.ts',
            import: './dist/*.proxy.js',
            require: './dist/*.proxy.js',
            types: './dist/*.proxy.d.ts',
          },
          './*.stub': {
            'npm-own-source': './src/*.stub.ts',
            'gateway-dist': './dist/*.stub.d.ts',
            'gateway-source': './src/*.stub.ts',
            source: './src/*.stub.ts',
            import: './dist/*.stub.js',
            require: './dist/*.stub.js',
            types: './dist/*.stub.d.ts',
          },
          './*': {
            'npm-own-source': './src/*/*.ts',
            'gateway-dist': './dist/*/*.d.ts',
            'gateway-source': './src/*/*.ts',
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
          'jest-environment-jsdom': '^30.0.0',
        },
        publishConfig: { access: 'public' },
      });
      expect(
        testbed.readFile({
          relativePath: 'packages/@gateway/npm/src/index.d.ts',
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
          relativePath: 'packages/@gateway/node/src/fs__promises/copy-dir-contents-entries-recurse',
        }),
      ).toStrictEqual([
        'copy-dir-contents-entries-recurse.proxy.ts',
        'copy-dir-contents-entries-recurse.test.ts',
        'copy-dir-contents-entries-recurse.ts',
      ]);
      expect(
        testbed.listDir({
          relativePath: 'packages/@gateway/browser/__mocks__',
        }),
      ).toBe(null);
      expect(
        testbed.listDir({
          relativePath: 'packages/@gateway/bin/src',
        }),
      ).toStrictEqual(['index.d.ts']);

      // Every folder was scaffolded, named for the repo's own scope — a substring check on the raw
      // text (not a JSON.parse + property access) since only the name needs proving here, the full
      // shape already having been proven above for npm.
      for (const folder of ['node', 'browser', 'bin']) {
        const packageJsonContent = String(
          testbed.readFile({
            relativePath: `packages/@gateway/${folder}/package.json`,
          }),
        );

        expect(packageJsonContent).toMatch(new RegExp(`"name": "@acme/${folder}"`, 'u'));
      }

      const rootTsconfig = JSON.parse(String(testbed.readFile({ relativePath: 'tsconfig.json' })));

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
            relativePath: 'packages/pkg-a/package.json',
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
            relativePath: 'packages/pkg-a/tsconfig.json',
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
            relativePath: 'packages/pkg-a/tsconfig.build.json',
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
            relativePath: 'packages/pkg-b/package.json',
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
          relativePath: 'packages/pkg-b/tsconfig.json',
        }),
      );

      expect(JSON.parse(pkgBTsconfigBefore)).toStrictEqual({ extends: '../../tsconfig.json' });

      // Capture every gateway-touched file's exact bytes, then run again and assert none of them
      // changed even by a single byte.
      const filesToCompare = [
        'package.json',
        'tsconfig.json',
        'packages/@gateway/npm/package.json',
        'packages/@gateway/npm/tsconfig.json',
        'packages/@gateway/npm/tsconfig.build.json',
        'packages/@gateway/node/src/fs/fs.ts',
        'packages/pkg-a/package.json',
        'packages/pkg-a/tsconfig.json',
        'packages/pkg-a/tsconfig.build.json',
        'packages/pkg-b/package.json',
        'packages/pkg-b/tsconfig.json',
      ];
      const beforeSecondRun = filesToCompare.map((relativePath) =>
        String(testbed.readFile({ relativePath })),
      );

      const secondRun = await InstallFlow({
        context: InstallContextStub({
          value: {
            targetProjectRoot: testbed.guildPath,
            dungeonmasterRoot: testbed.dungeonmasterPath,
          },
        }),
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
        baseName: 'flow-gateway-unscoped',
      });

      testbed.writeFile({
        relativePath: 'package.json',
        content: JSON.stringify({ name: 'my-app', version: '1.0.0' }, null, 2),
      });

      const result = await InstallFlow({
        context: InstallContextStub({
          value: {
            targetProjectRoot: testbed.guildPath,
            dungeonmasterRoot: testbed.dungeonmasterPath,
          },
        }),
      });

      const npmPackageJson = JSON.parse(
        String(
          testbed.readFile({
            relativePath: 'packages/@gateway/npm/package.json',
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
            'gateway-source': './src/*.proxy.ts',
            source: './src/*.proxy.ts',
            import: './dist/*.proxy.js',
            require: './dist/*.proxy.js',
            types: './dist/*.proxy.d.ts',
          },
          './*.stub': {
            'npm-own-source': './src/*.stub.ts',
            'gateway-dist': './dist/*.stub.d.ts',
            'gateway-source': './src/*.stub.ts',
            source: './src/*.stub.ts',
            import: './dist/*.stub.js',
            require: './dist/*.stub.js',
            types: './dist/*.stub.d.ts',
          },
          './*': {
            'npm-own-source': './src/*/*.ts',
            'gateway-dist': './dist/*/*.d.ts',
            'gateway-source': './src/*/*.ts',
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
          'jest-environment-jsdom': '^30.0.0',
        },
        publishConfig: { access: 'public' },
      });
    });

    it('VALID: {root dependencies: left-pad, devDependencies: left-pad-dev, husky postinstall} => appends the sync to postinstall, generates a left-pad passthrough recorded in the npm gateway, and a second run keeps a hand-edited folder', async () => {
      npmFake.stageSucceeds();
      const testbed = installTestbedCreateBroker({
        baseName: 'flow-gateway-npm-sync',
      });

      testbed.writeFile({
        relativePath: 'package.json',
        content: `{
  "name": "@acme/app",
  "version": "1.0.0",
  "workspaces": ["packages/*"],
  "scripts": { "postinstall": "husky" },
  "dependencies": { "left-pad": "^1.3.0" },
  "devDependencies": { "left-pad-dev": "^1.0.0" }
}
`,
      });

      const firstRun = await InstallFlow({
        context: InstallContextStub({
          value: {
            targetProjectRoot: testbed.guildPath,
            dungeonmasterRoot: testbed.dungeonmasterPath,
          },
        }),
      });

      const rootPackageJson = JSON.parse(
        String(testbed.readFile({ relativePath: 'package.json' })),
      );
      const npmGatewayPackageJson = testbed.readFile({
        relativePath: 'packages/@gateway/npm/package.json',
      });
      const npmGatewaySrc = testbed.listDir({ relativePath: 'packages/@gateway/npm/src' });
      const leftPadBarrel = testbed.readFile({
        relativePath: 'packages/@gateway/npm/src/left-pad/left-pad.ts',
      });
      const leftPadTest = testbed.readFile({
        relativePath: 'packages/@gateway/npm/src/left-pad/left-pad.test.ts',
      });

      testbed.writeFile({
        relativePath: 'packages/@gateway/npm/src/left-pad/left-pad.ts',
        content: "export { default } from 'left-pad';\n",
      });

      const secondRun = await InstallFlow({
        context: InstallContextStub({
          value: {
            targetProjectRoot: testbed.guildPath,
            dungeonmasterRoot: testbed.dungeonmasterPath,
          },
        }),
      });

      const leftPadBarrelAfterSecondRun = testbed.readFile({
        relativePath: 'packages/@gateway/npm/src/left-pad/left-pad.ts',
      });

      testbed.cleanup();

      expect({ firstRun, secondRun }).toStrictEqual({
        firstRun: {
          packageName: '@dungeonmaster/cli',
          success: true,
          action: 'created',
          message:
            'Added devDependencies to package.json; target project is not e2e-eligible (packageType is not frontend-react or frontend-ink); Created tsconfig.json; target project has npm workspaces (each package owns its own jest.config.js); added packages/@gateway/* to workspaces; set the root postinstall script to run dungeonmaster gateway-sync; scaffolded gateway packages: npm, node, browser, bin; synced packages/@gateway/npm/src (generated: left-pad / untyped: left-pad); tsconfig.json already resolves node16; updated imports in 0 existing package(s); set gateway-dist in tsconfig.build.json of 0 existing package(s)',
        },
        secondRun: {
          packageName: '@dungeonmaster/cli',
          success: true,
          action: 'skipped',
          message:
            'All devDependencies already present; target project is not e2e-eligible (packageType is not frontend-react or frontend-ink); tsconfig.json already exists; target project has npm workspaces (each package owns its own jest.config.js); workspaces already includes packages/@gateway/*; root postinstall script already runs gateway-sync; gateway packages already scaffolded; packages/@gateway/npm/src already has a folder for every dependency; tsconfig.json already resolves node16; updated imports in 0 existing package(s); set gateway-dist in tsconfig.build.json of 0 existing package(s)',
        },
      });
      expect(rootPackageJson).toStrictEqual({
        name: '@acme/app',
        version: '1.0.0',
        workspaces: ['packages/*', 'packages/@gateway/*'],
        scripts: {
          postinstall:
            'husky && if command -v dungeonmaster >/dev/null 2>&1; then dungeonmaster gateway-sync; fi',
        },
        dependencies: { 'left-pad': '^1.3.0' },
        devDependencies: { 'left-pad-dev': '^1.0.0', ...devDependenciesStatics.packages },
      });
      expect(npmGatewayPackageJson).toMatch(
        /^ {2}"dependencies": \{\n {4}"left-pad": "\^1\.3\.0"\n {2}\},?$/mu,
      );
      expect(npmGatewaySrc).toStrictEqual(['left-pad']);
      expect(leftPadBarrel).toBe(`/**
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
      expect(leftPadTest).toBe(`import * as ourModule from './left-pad';
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
`);
      expect(leftPadBarrelAfterSecondRun).toBe("export { default } from 'left-pad';\n");
    });

    it('EDGE: {packages/@gateway/npm exists with no package.json, root depends on left-pad} => leaves that folder alone and says there is no npm gateway package to sync into', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: 'flow-gateway-npm-no-package-json',
      });

      testbed.writeFile({
        relativePath: 'package.json',
        content: `{
  "name": "@acme/app",
  "version": "1.0.0",
  "workspaces": ["packages/*"],
  "dependencies": { "left-pad": "^1.3.0" }
}
`,
      });
      testbed.writeFile({
        relativePath: 'packages/@gateway/npm/notes.md',
        content: 'hand-made\n',
      });

      const result = await InstallFlow({
        context: InstallContextStub({
          value: {
            targetProjectRoot: testbed.guildPath,
            dungeonmasterRoot: testbed.dungeonmasterPath,
          },
        }),
      });

      const npmGatewayEntries = testbed.listDir({ relativePath: 'packages/@gateway/npm' });

      testbed.cleanup();

      expect({ message: result.message, npmGatewayEntries }).toStrictEqual({
        message:
          'Added devDependencies to package.json; target project is not e2e-eligible (packageType is not frontend-react or frontend-ink); Created tsconfig.json; target project has npm workspaces (each package owns its own jest.config.js); added packages/@gateway/* to workspaces; set the root postinstall script to run dungeonmaster gateway-sync; scaffolded gateway packages: node, browser, bin; no packages/@gateway/npm/package.json to sync dependencies into; tsconfig.json already resolves node16; updated imports in 0 existing package(s); set gateway-dist in tsconfig.build.json of 0 existing package(s)',
        npmGatewayEntries: ['notes.md'],
      });
    });
  });
});
