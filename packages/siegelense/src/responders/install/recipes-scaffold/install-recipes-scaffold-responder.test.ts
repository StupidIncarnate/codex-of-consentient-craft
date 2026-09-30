import { InstallContextStub } from '@dungeonmaster/shared/contracts/install-context/install-context.stub';
import { locationsStatics, recipesConventionStatics } from '@dungeonmaster/shared/statics';

import { InstallRecipesScaffoldResponderProxy } from './install-recipes-scaffold-responder.proxy';

const CONTEXT = InstallContextStub({
  value: {
    targetProjectRoot: '/project',
    dungeonmasterRoot: '/dm-root',
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
          'jest.config.js, src/index.ts, src/startup/, src/flows/, src/responders/)',
      });

      const sortByLocale = (a: unknown, b: unknown) => String(a).localeCompare(String(b));

      expect([...proxy.getCreatedDirs()].sort(sortByLocale)).toStrictEqual(
        [
          '/project/packages/hydration-recipes',
          '/project/packages/hydration-recipes/src',
          '/project/packages/hydration-recipes/src/startup',
          '/project/packages/hydration-recipes/src/flows/recipes',
          '/project/packages/hydration-recipes/src/responders',
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
        relativePath: 'package.json',
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
          './package.json': './package.json',
          './*.proxy': { source: './src/*.proxy.ts' },
          './*.stub': { source: './src/*.stub.ts' },
          './responders': {
            source: './src/responders/responders.ts',
            types: './dist/responders/responders.d.ts',
            import: './dist/responders/responders.js',
            require: './dist/responders/responders.js',
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

    it('VALID: {no root package.json} => marks recipesScaffoldState with the unscoped package name', async () => {
      const proxy = InstallRecipesScaffoldResponderProxy();
      proxy.setupPackageAbsent();

      await proxy.callResponder({ context: CONTEXT });

      expect(proxy.getMarkedScaffoldedRecipesPackageName()).toBe('hydration-recipes');
    });
  });

  describe('package absent, root package.json exists but carries no name field', () => {
    it("VALID: {rootPackageJson: {}} => falls back to the target directory's basename, the same fallback install-setup-gateway-responder uses", async () => {
      const proxy = InstallRecipesScaffoldResponderProxy();
      proxy.setupPackageAbsent({ rootPackageJsonPresent: true });

      await proxy.callResponder({ context: CONTEXT });

      const packageJsonContents = proxy.getWrittenContents({
        relativePath: 'package.json',
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
          './package.json': './package.json',
          './*.proxy': { source: './src/*.proxy.ts' },
          './*.stub': { source: './src/*.stub.ts' },
          './responders': {
            source: './src/responders/responders.ts',
            types: './dist/responders/responders.d.ts',
            import: './dist/responders/responders.js',
            require: './dist/responders/responders.js',
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
        relativePath: 'package.json',
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
          './package.json': './package.json',
          './*.proxy': { source: './src/*.proxy.ts' },
          './*.stub': { source: './src/*.stub.ts' },
          './responders': {
            source: './src/responders/responders.ts',
            types: './dist/responders/responders.d.ts',
            import: './dist/responders/responders.js',
            require: './dist/responders/responders.js',
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
        relativePath: locationsStatics.repoRoot.tsconfig,
      });

      expect(JSON.parse(String(tsconfigContents))).toStrictEqual({
        extends: '../../tsconfig.json',
        compilerOptions: {
          typeRoots: ['../../node_modules/@types', '../../@types'],
        },
        include: ['src/**/*'],
      });
    });

    it('VALID: {rootPackageJsonName: "@acme/root-app"} => tsconfig.build.json compiles src/index.ts to dist/index.js', async () => {
      const proxy = InstallRecipesScaffoldResponderProxy();
      proxy.setupPackageAbsent({ rootPackageJsonName: '@acme/root-app' });

      await proxy.callResponder({ context: CONTEXT });

      const tsconfigBuildContents = proxy.getWrittenContents({
        relativePath: 'tsconfig.build.json',
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
        proxy.getWrittenContents({ relativePath: 'src/index.ts' }),
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
            relativePath: 'src/startup/start-hydration-recipes.ts',
          }),
        ).includes('export const StartHydrationRecipes'),
        flow: String(
          proxy.getWrittenContents({
            relativePath: 'src/flows/recipes/recipes-flow.ts',
          }),
        ).includes('export const RecipesFlow'),
        respondersBarrel: String(
          proxy.getWrittenContents({
            relativePath: 'src/responders/responders.ts',
          }),
        ).includes('export * from'),
        listingResponder: String(
          proxy.getWrittenContents({
            relativePath: 'src/responders/recipes/listing/recipes-listing-responder.ts',
          }),
        ).includes(`export const ${recipesConventionStatics.exports.listing}`),
        seedResponder: String(
          proxy.getWrittenContents({
            relativePath: 'src/responders/recipes/seed/recipes-seed-responder.ts',
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
        relativePath: 'package.json',
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
          './package.json': './package.json',
          './*.proxy': { source: './src/*.proxy.ts' },
          './*.stub': { source: './src/*.stub.ts' },
          './responders': {
            source: './src/responders/responders.ts',
            types: './dist/responders/responders.d.ts',
            import: './dist/responders/responders.js',
            require: './dist/responders/responders.js',
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

    it('VALID: {rootPackageJsonName: "acme-app"} => marks recipesScaffoldState with the scoped package name', async () => {
      const proxy = InstallRecipesScaffoldResponderProxy();
      proxy.setupPackageAbsent({ rootPackageJsonName: 'acme-app' });

      await proxy.callResponder({ context: CONTEXT });

      expect(proxy.getMarkedScaffoldedRecipesPackageName()).toBe('@acme-app/hydration-recipes');
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

    it('VALID: {packages/hydration-recipes present} => recipesScaffoldState is left unmarked', async () => {
      const proxy = InstallRecipesScaffoldResponderProxy();
      proxy.setupPackagePresent();

      await proxy.callResponder({ context: CONTEXT });

      expect(proxy.getMarkedScaffoldedRecipesPackageName()).toBe(undefined);
    });
  });
});
