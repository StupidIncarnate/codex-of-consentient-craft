import { FilePathStub, InstallContextStub, PathSegmentStub } from '@dungeonmaster/shared/contracts';
import { locationsStatics, recipesConventionStatics } from '@dungeonmaster/shared/statics';

import { InstallRecipesScaffoldResponderProxy } from './install-recipes-scaffold-responder.proxy';

const CONTEXT = InstallContextStub({
  value: {
    targetProjectRoot: FilePathStub({ value: '/project' }),
    dungeonmasterRoot: FilePathStub({ value: '/dm-root' }),
  },
});

describe('InstallRecipesScaffoldResponder', () => {
  describe('package absent, no root package.json', () => {
    it('VALID: {no root package.json} => created, package.json/tsconfig.json/tsconfig.build.json/src/index.ts/src/index.test.ts written', async () => {
      const proxy = InstallRecipesScaffoldResponderProxy();
      proxy.setupPackageAbsent();

      const result = await proxy.callResponder({ context: CONTEXT });

      expect(result).toStrictEqual({
        packageName: '@dungeonmaster/siegelense',
        success: true,
        action: 'created',
        message:
          'Created packages/hydration-recipes/ (package.json, tsconfig.json, tsconfig.build.json, ' +
          'jest.config.js, responders.ts, src/index.ts, src/startup/, src/flows/, src/responders/)',
      });

      const sortByLocale = (a: unknown, b: unknown) => String(a).localeCompare(String(b));

      expect([...proxy.getCreatedDirs()].sort(sortByLocale)).toStrictEqual(
        [
          '/project/packages/hydration-recipes',
          '/project/packages/hydration-recipes/src',
          '/project/packages/hydration-recipes/src/startup',
          '/project/packages/hydration-recipes/src/flows/recipes',
          '/project/packages/hydration-recipes/src/responders/recipes/listing',
          '/project/packages/hydration-recipes/src/responders/recipes/seed',
        ].sort(sortByLocale),
      );
    });

    it('VALID: {no root package.json} => package.json is unscoped', async () => {
      const proxy = InstallRecipesScaffoldResponderProxy();
      proxy.setupPackageAbsent();

      await proxy.callResponder({ context: CONTEXT });

      const packageJsonContents = proxy.getWrittenContents({
        relativePath: PathSegmentStub({ value: 'package.json' }),
      });

      expect(JSON.parse(String(packageJsonContents))).toStrictEqual({
        name: 'hydration-recipes',
        version: '0.1.0',
        description: 'hydration-recipes package',
        private: true,
        exports: {
          '.': {
            source: './src/index.ts',
            import: './dist/index.js',
            require: './dist/index.js',
            types: './dist/index.d.ts',
          },
        },
        scripts: {
          build: 'tsc -p tsconfig.build.json',
          'build:clean': 'rm -rf dist .ward/build.tsbuildinfo && npm run build',
          test: 'dungeonmaster-ward --only test',
          typecheck: 'dungeonmaster-ward --only typecheck',
          lint: 'dungeonmaster-ward --only lint',
          ward: 'dungeonmaster-ward',
        },
        devDependencies: {
          '@types/node': '^20.11.0',
          typescript: '^5.3.3',
        },
      });
    });
  });

  describe('package absent, root package.json exists but carries no name field', () => {
    it("VALID: {rootPackageJson: {}} => falls back to the target directory's basename, the same fallback install-setup-gateway-responder uses", async () => {
      const proxy = InstallRecipesScaffoldResponderProxy();
      proxy.setupPackageAbsent({ rootPackageJsonPresent: true });

      await proxy.callResponder({ context: CONTEXT });

      const packageJsonContents = proxy.getWrittenContents({
        relativePath: PathSegmentStub({ value: 'package.json' }),
      });

      expect(JSON.parse(String(packageJsonContents))).toStrictEqual({
        name: '@project/hydration-recipes',
        version: '0.1.0',
        description: 'hydration-recipes package',
        private: true,
        imports: {
          '#gateway/npm/*': '@project/npm/*',
          '#gateway/node/*': '@project/node/*',
          '#gateway/browser/*': '@project/browser/*',
          '#gateway/bin/*': '@project/bin/*',
        },
        exports: {
          '.': {
            source: './src/index.ts',
            import: './dist/index.js',
            require: './dist/index.js',
            types: './dist/index.d.ts',
          },
        },
        scripts: {
          build: 'tsc -p tsconfig.build.json',
          'build:clean': 'rm -rf dist .ward/build.tsbuildinfo && npm run build',
          test: 'dungeonmaster-ward --only test',
          typecheck: 'dungeonmaster-ward --only typecheck',
          lint: 'dungeonmaster-ward --only lint',
          ward: 'dungeonmaster-ward',
        },
        devDependencies: {
          '@types/node': '^20.11.0',
          typescript: '^5.3.3',
        },
      });
    });
  });

  describe('package absent, root package.json name field is a scoped "@scope/rest" name', () => {
    it('VALID: {rootPackageJsonName: "@acme/root-app"} => package.json is scoped to "@acme", with a matching #gateway/* imports field', async () => {
      const proxy = InstallRecipesScaffoldResponderProxy();
      proxy.setupPackageAbsent({ rootPackageJsonName: '@acme/root-app' });

      await proxy.callResponder({ context: CONTEXT });

      const packageJsonContents = proxy.getWrittenContents({
        relativePath: PathSegmentStub({ value: 'package.json' }),
      });

      expect(JSON.parse(String(packageJsonContents))).toStrictEqual({
        name: '@acme/hydration-recipes',
        version: '0.1.0',
        description: 'hydration-recipes package',
        private: true,
        imports: {
          '#gateway/npm/*': '@acme/npm/*',
          '#gateway/node/*': '@acme/node/*',
          '#gateway/browser/*': '@acme/browser/*',
          '#gateway/bin/*': '@acme/bin/*',
        },
        exports: {
          '.': {
            source: './src/index.ts',
            import: './dist/index.js',
            require: './dist/index.js',
            types: './dist/index.d.ts',
          },
        },
        scripts: {
          build: 'tsc -p tsconfig.build.json',
          'build:clean': 'rm -rf dist .ward/build.tsbuildinfo && npm run build',
          test: 'dungeonmaster-ward --only test',
          typecheck: 'dungeonmaster-ward --only typecheck',
          lint: 'dungeonmaster-ward --only lint',
          ward: 'dungeonmaster-ward',
        },
        devDependencies: {
          '@types/node': '^20.11.0',
          typescript: '^5.3.3',
        },
      });
    });

    it('VALID: {rootPackageJsonName: "@acme/root-app"} => tsconfig.json is written', async () => {
      const proxy = InstallRecipesScaffoldResponderProxy();
      proxy.setupPackageAbsent({ rootPackageJsonName: '@acme/root-app' });

      await proxy.callResponder({ context: CONTEXT });

      const tsconfigContents = proxy.getWrittenContents({
        relativePath: PathSegmentStub({ value: locationsStatics.repoRoot.tsconfig }),
      });

      expect(JSON.parse(String(tsconfigContents))).toStrictEqual({
        extends: '../../tsconfig.json',
        compilerOptions: {
          typeRoots: ['../../node_modules/@types', '../../@types'],
        },
        include: ['src/**/*', 'responders.ts'],
      });
    });

    it('VALID: {rootPackageJsonName: "@acme/root-app"} => tsconfig.build.json compiles src/index.ts to dist/index.js', async () => {
      const proxy = InstallRecipesScaffoldResponderProxy();
      proxy.setupPackageAbsent({ rootPackageJsonName: '@acme/root-app' });

      await proxy.callResponder({ context: CONTEXT });

      const tsconfigBuildContents = proxy.getWrittenContents({
        relativePath: PathSegmentStub({ value: 'tsconfig.build.json' }),
      });

      expect(JSON.parse(String(tsconfigBuildContents))).toStrictEqual({
        extends: './tsconfig.json',
        compilerOptions: {
          noEmit: false,
          rootDir: './src',
          outDir: './dist',
          declaration: true,
          declarationMap: true,
          incremental: true,
          tsBuildInfoFile: './.ward/build.tsbuildinfo',
        },
        include: ['src/**/*'],
        exclude: [
          '**/*.test.ts',
          '**/*.integration.test.ts',
          '**/*.proxy.ts',
          '**/*.stub.ts',
          '**/*.harness.ts',
          'src/.test-tmp/**',
          'src/_lint-testbed/**',
        ],
      });
    });

    it('VALID: {rootPackageJsonName: "@acme/root-app"} => src/index.ts exports the three recipesConventionStatics names', async () => {
      const proxy = InstallRecipesScaffoldResponderProxy();
      proxy.setupPackageAbsent({ rootPackageJsonName: '@acme/root-app' });

      await proxy.callResponder({ context: CONTEXT });

      const indexTsContents = String(
        proxy.getWrittenContents({ relativePath: PathSegmentStub({ value: 'src/index.ts' }) }),
      );

      expect(indexTsContents).toMatch(
        /^import \{ StartHydrationRecipes \} from '\.\/startup\/start-hydration-recipes';$/mu,
      );
      expect(indexTsContents).toMatch(
        new RegExp(`^export const ${recipesConventionStatics.exports.listing} = `, 'mu'),
      );
      expect(indexTsContents).toMatch(
        new RegExp(`^export const ${recipesConventionStatics.exports.seed} = `, 'mu'),
      );
      expect(indexTsContents).toMatch(
        new RegExp(
          `^export const ${recipesConventionStatics.exports.manifest}: readonly never\\[\\] = \\[\\];$`,
          'mu',
        ),
      );
    });

    it('VALID: {rootPackageJsonName: "@acme/root-app"} => the five enforce-hydration-recipes-structure files are all written', async () => {
      const proxy = InstallRecipesScaffoldResponderProxy();
      proxy.setupPackageAbsent({ rootPackageJsonName: '@acme/root-app' });

      await proxy.callResponder({ context: CONTEXT });

      expect({
        startup: String(
          proxy.getWrittenContents({
            relativePath: PathSegmentStub({ value: 'src/startup/start-hydration-recipes.ts' }),
          }),
        ).includes('export const StartHydrationRecipes'),
        flow: String(
          proxy.getWrittenContents({
            relativePath: PathSegmentStub({ value: 'src/flows/recipes/recipes-flow.ts' }),
          }),
        ).includes('export const RecipesFlow'),
        respondersBarrel: String(
          proxy.getWrittenContents({ relativePath: PathSegmentStub({ value: 'responders.ts' }) }),
        ).includes('export * from'),
        listingResponder: String(
          proxy.getWrittenContents({
            relativePath: PathSegmentStub({
              value: 'src/responders/recipes/listing/recipes-listing-responder.ts',
            }),
          }),
        ).includes(`export const ${recipesConventionStatics.exports.listing}`),
        seedResponder: String(
          proxy.getWrittenContents({
            relativePath: PathSegmentStub({
              value: 'src/responders/recipes/seed/recipes-seed-responder.ts',
            }),
          }),
        ).includes(`export const ${recipesConventionStatics.exports.seed}`),
      }).toStrictEqual({
        startup: true,
        flow: true,
        respondersBarrel: true,
        listingResponder: true,
        seedResponder: true,
      });
    });
  });

  describe('package absent, root package.json name field is unscoped', () => {
    it('VALID: {rootPackageJsonName: "acme-app"} => package.json is scoped to "@acme-app" (the name itself becomes the scope)', async () => {
      const proxy = InstallRecipesScaffoldResponderProxy();
      proxy.setupPackageAbsent({ rootPackageJsonName: 'acme-app' });

      await proxy.callResponder({ context: CONTEXT });

      const packageJsonContents = proxy.getWrittenContents({
        relativePath: PathSegmentStub({ value: 'package.json' }),
      });

      expect(JSON.parse(String(packageJsonContents))).toStrictEqual({
        name: '@acme-app/hydration-recipes',
        version: '0.1.0',
        description: 'hydration-recipes package',
        private: true,
        imports: {
          '#gateway/npm/*': '@acme-app/npm/*',
          '#gateway/node/*': '@acme-app/node/*',
          '#gateway/browser/*': '@acme-app/browser/*',
          '#gateway/bin/*': '@acme-app/bin/*',
        },
        exports: {
          '.': {
            source: './src/index.ts',
            import: './dist/index.js',
            require: './dist/index.js',
            types: './dist/index.d.ts',
          },
        },
        scripts: {
          build: 'tsc -p tsconfig.build.json',
          'build:clean': 'rm -rf dist .ward/build.tsbuildinfo && npm run build',
          test: 'dungeonmaster-ward --only test',
          typecheck: 'dungeonmaster-ward --only typecheck',
          lint: 'dungeonmaster-ward --only lint',
          ward: 'dungeonmaster-ward',
        },
        devDependencies: {
          '@types/node': '^20.11.0',
          typescript: '^5.3.3',
        },
      });
    });
  });

  describe('package present, holding a recipe', () => {
    it('VALID: {packages/hydration-recipes present} => nothing written, existing contents survive untouched', async () => {
      const proxy = InstallRecipesScaffoldResponderProxy();
      proxy.setupPackagePresent();

      const result = await proxy.callResponder({ context: CONTEXT });

      expect(result).toStrictEqual({
        packageName: '@dungeonmaster/siegelense',
        success: true,
        action: 'skipped',
        message: 'packages/hydration-recipes/ already present; left untouched',
      });
      expect(proxy.getCreatedDirs()).toStrictEqual([]);
    });

    it('VALID: {packages/hydration-recipes present} => neither npm install nor npm run build runs', async () => {
      const proxy = InstallRecipesScaffoldResponderProxy();
      proxy.setupPackagePresent();

      await proxy.callResponder({ context: CONTEXT });

      expect(proxy.wasNpmSpawned()).toBe(false);
    });
  });

  describe('package absent, npm install and npm run build both succeed', () => {
    it('VALID: {fresh scaffold} => npm install runs, then npm run build --workspace=<name>, both from targetProjectRoot', async () => {
      const proxy = InstallRecipesScaffoldResponderProxy();
      proxy.setupPackageAbsent();

      await proxy.callResponder({ context: CONTEXT });

      expect({
        installArgs: proxy.getInstallSpawnArgs(),
        buildArgs: proxy.getBuildSpawnArgs(),
        installFromCwd: proxy.wasInstallSpawnedFromCwd({ cwd: '/project' }),
        buildFromCwd: proxy.wasBuildSpawnedFromCwd({ cwd: '/project' }),
      }).toStrictEqual({
        installArgs: ['install'],
        buildArgs: ['run', 'build', '--workspace=hydration-recipes'],
        installFromCwd: true,
        buildFromCwd: true,
      });
    });

    it('VALID: {fresh scaffold} => the result message is unchanged by a successful install and build', async () => {
      const proxy = InstallRecipesScaffoldResponderProxy();
      proxy.setupPackageAbsent();

      const result = await proxy.callResponder({ context: CONTEXT });

      expect(result).toStrictEqual({
        packageName: '@dungeonmaster/siegelense',
        success: true,
        action: 'created',
        message:
          'Created packages/hydration-recipes/ (package.json, tsconfig.json, tsconfig.build.json, ' +
          'jest.config.js, responders.ts, src/index.ts, src/startup/, src/flows/, src/responders/)',
      });
    });
  });

  describe('package absent, npm install fails', () => {
    it('ERROR: {npm install exits non-zero} => success: false, the message names the failure and the command to run by hand, and build is never attempted', async () => {
      const proxy = InstallRecipesScaffoldResponderProxy();
      proxy.setupPackageAbsent();
      proxy.setupInstallFails({ output: 'npm ERR! network request failed' });

      const result = await proxy.callResponder({ context: CONTEXT });

      expect(result).toStrictEqual({
        packageName: '@dungeonmaster/siegelense',
        success: false,
        action: 'created',
        message:
          'Created packages/hydration-recipes/ (package.json, tsconfig.json, tsconfig.build.json, ' +
          'jest.config.js, responders.ts, src/index.ts, src/startup/, src/flows/, src/responders/); ' +
          'npm install failed (exit 1): npm ERR! network request failed — run "npm install" at the repo root, ' +
          'then "npm run build --workspace=hydration-recipes" to finish setting it up',
      });
      expect(proxy.getBuildSpawnArgs()).toBe(undefined);
    });
  });

  describe('package absent, npm install succeeds but npm run build fails', () => {
    it('ERROR: {npm run build exits non-zero} => success: false, the message names the failure and the exact build command to run by hand', async () => {
      const proxy = InstallRecipesScaffoldResponderProxy();
      proxy.setupPackageAbsent();
      proxy.setupBuildFails({ output: 'error TS2307: Cannot find module' });

      const result = await proxy.callResponder({ context: CONTEXT });

      expect(result).toStrictEqual({
        packageName: '@dungeonmaster/siegelense',
        success: false,
        action: 'created',
        message:
          'Created packages/hydration-recipes/ (package.json, tsconfig.json, tsconfig.build.json, ' +
          'jest.config.js, responders.ts, src/index.ts, src/startup/, src/flows/, src/responders/); ' +
          'npm run build --workspace=hydration-recipes failed (exit 1): error TS2307: Cannot find module — run ' +
          '"npm run build --workspace=hydration-recipes" to finish setting it up',
      });
    });
  });
});
