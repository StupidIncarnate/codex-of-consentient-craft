import {
  installTestbedCreateBroker,
  BaseNameStub,
  RelativePathStub,
  FileContentStub,
} from '@dungeonmaster/testing';
import { FilePathStub } from '@dungeonmaster/shared/contracts';
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
          'Added devDependencies to package.json; Created playwright.config.ts; Created tsconfig.json; Created jest.config.js; added packages/@gateway/* to workspaces; scaffolded gateway packages: npm, node, browser, bin; added gateway paths to tsconfig.json; updated imports in 0 existing package(s); updated tsconfig.json paths in 0 existing package(s); updated tsconfig.build.json paths in 0 existing package(s)',
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
          'All devDependencies already present; playwright.config.ts already exists; tsconfig.json already exists; jest.config.js already exists; added packages/@gateway/* to workspaces; scaffolded gateway packages: npm, node, browser, bin; tsconfig.json gateway paths already present; updated imports in 0 existing package(s); updated tsconfig.json paths in 0 existing package(s); updated tsconfig.build.json paths in 0 existing package(s)',
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
          'Added devDependencies to package.json; target project is not e2e-eligible (packageType is not frontend-react or frontend-ink); Created tsconfig.json; Created jest.config.js; added packages/@gateway/* to workspaces; scaffolded gateway packages: npm, node, browser, bin; added gateway paths to tsconfig.json; updated imports in 0 existing package(s); updated tsconfig.json paths in 0 existing package(s); updated tsconfig.build.json paths in 0 existing package(s)',
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
          'Added devDependencies to package.json; target project is not e2e-eligible (packageType is not frontend-react or frontend-ink); Created tsconfig.json; target project has npm workspaces (each package owns its own jest.config.js); added packages/@gateway/* to workspaces; scaffolded gateway packages: npm, node, browser, bin; added gateway paths to tsconfig.json; updated imports in 0 existing package(s); updated tsconfig.json paths in 0 existing package(s); updated tsconfig.build.json paths in 0 existing package(s)',
      });
      expect(jestConfigContent).toBe(null);
    });
  });

  describe('setup-gateway', () => {
    it('VALID: {scoped root name, two packages — one with its own tsconfig paths, one with an existing imports entry} => scaffolds the four gateway packages, wires every package in, and a second run changes nothing', async () => {
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
        imports: {
          '#gateway/npm/*': '@acme/npm/*',
          '#gateway/node/*': '@acme/node/*',
          '#gateway/browser/*': '@acme/browser/*',
          '#gateway/bin/*': '@acme/bin/*',
        },
        exports: {
          './_test_': {
            source: './src/_test_/index.ts',
            import: './dist/_test_/index.js',
            require: './dist/_test_/index.js',
            types: './dist/_test_/index.d.ts',
          },
          './*': {
            source: './src/*/index.ts',
            import: './dist/*/index.js',
            require: './dist/*/index.js',
            types: './dist/*/index.d.ts',
          },
        },
        typesVersions: { '*': { '*': ['src/*/index.ts', 'src/*'] } },
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
          relativePath: RelativePathStub({ value: 'packages/@gateway/npm/src/_test_/index.ts' }),
        }),
      ).toBe(`/**
 * PURPOSE: Caller-facing proxy surface for @acme/npm's wrapped modules. Empty until
 * a wrapped (non-pass-through) module needs a proxy a caller can import.
 *
 * USAGE:
 * import { exampleProxy } from '@acme/npm/_test_';
 */
`);

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
          typeRoots: ['./node_modules/@types', './@types'],
          paths: {
            '#gateway/npm/*': [
              './packages/@gateway/npm/src/*/index.ts',
              './packages/@gateway/npm/src/*',
            ],
            '#gateway/node/*': [
              './packages/@gateway/node/src/*/index.ts',
              './packages/@gateway/node/src/*',
            ],
            '#gateway/browser/*': [
              './packages/@gateway/browser/src/*/index.ts',
              './packages/@gateway/browser/src/*',
            ],
            '#gateway/bin/*': [
              './packages/@gateway/bin/src/*/index.ts',
              './packages/@gateway/bin/src/*',
            ],
          },
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
          paths: {
            '#alias/*': ['./src/*'],
            '#gateway/npm/*': ['../@gateway/npm/src/*/index.ts', '../@gateway/npm/src/*'],
            '#gateway/node/*': ['../@gateway/node/src/*/index.ts', '../@gateway/node/src/*'],
            '#gateway/browser/*': [
              '../@gateway/browser/src/*/index.ts',
              '../@gateway/browser/src/*',
            ],
            '#gateway/bin/*': ['../@gateway/bin/src/*/index.ts', '../@gateway/bin/src/*'],
          },
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
          paths: {
            '#gateway/npm/*': ['../@gateway/npm/dist/*/index.d.ts'],
            '#gateway/node/*': ['../@gateway/node/dist/*/index.d.ts'],
            '#gateway/browser/*': ['../@gateway/browser/dist/*/index.d.ts'],
            '#gateway/bin/*': ['../@gateway/bin/dist/*/index.d.ts'],
          },
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

      // pkg-b never declared its own tsconfig paths, so the merge leaves it untouched — it
      // inherits the root's paths via `extends` instead of getting its own copy.
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
        imports: {
          '#gateway/npm/*': '@my-app/npm/*',
          '#gateway/node/*': '@my-app/node/*',
          '#gateway/browser/*': '@my-app/browser/*',
          '#gateway/bin/*': '@my-app/bin/*',
        },
        exports: {
          './_test_': {
            source: './src/_test_/index.ts',
            import: './dist/_test_/index.js',
            require: './dist/_test_/index.js',
            types: './dist/_test_/index.d.ts',
          },
          './*': {
            source: './src/*/index.ts',
            import: './dist/*/index.js',
            require: './dist/*/index.js',
            types: './dist/*/index.d.ts',
          },
        },
        typesVersions: { '*': { '*': ['src/*/index.ts', 'src/*'] } },
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
