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
          'Created packages/hydration-recipes/ (package.json, tsconfig.json, tsconfig.build.json, src/index.ts)',
      });
      expect(proxy.getCreatedDirs()).toStrictEqual(['/project/packages/hydration-recipes/src']);
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

  describe('package absent, root package.json carries a scoped workspace dependency', () => {
    it('VALID: {rootDependencies: {"@acme/shared": "*"}} => package.json is scoped to "@acme"', async () => {
      const proxy = InstallRecipesScaffoldResponderProxy();
      proxy.setupPackageAbsent({ rootDependencies: { '@acme/shared': '*' } });

      await proxy.callResponder({ context: CONTEXT });

      const packageJsonContents = proxy.getWrittenContents({
        relativePath: PathSegmentStub({ value: 'package.json' }),
      });

      expect(JSON.parse(String(packageJsonContents))).toStrictEqual({
        name: '@acme/hydration-recipes',
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

    it('VALID: {rootDependencies: {"@acme/shared": "*"}} => tsconfig.json is written', async () => {
      const proxy = InstallRecipesScaffoldResponderProxy();
      proxy.setupPackageAbsent({ rootDependencies: { '@acme/shared': '*' } });

      await proxy.callResponder({ context: CONTEXT });

      const tsconfigContents = proxy.getWrittenContents({
        relativePath: PathSegmentStub({ value: locationsStatics.repoRoot.tsconfig }),
      });

      expect(JSON.parse(String(tsconfigContents))).toStrictEqual({
        extends: '../../tsconfig.json',
        compilerOptions: {
          typeRoots: ['../../node_modules/@types', '../../@types'],
        },
        include: ['src/**/*'],
      });
    });

    it('VALID: {rootDependencies: {"@acme/shared": "*"}} => tsconfig.build.json compiles src/index.ts to dist/index.js', async () => {
      const proxy = InstallRecipesScaffoldResponderProxy();
      proxy.setupPackageAbsent({ rootDependencies: { '@acme/shared': '*' } });

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
        exclude: [
          '**/*.test.ts',
          '**/*.proxy.ts',
          '**/*.stub.ts',
          '**/*.harness.ts',
          'src/.test-tmp/**',
          'src/_lint-testbed/**',
        ],
      });
    });

    it('VALID: {rootDependencies: {"@acme/shared": "*"}} => src/index.ts exports the three recipesConventionStatics names', async () => {
      const proxy = InstallRecipesScaffoldResponderProxy();
      proxy.setupPackageAbsent({ rootDependencies: { '@acme/shared': '*' } });

      await proxy.callResponder({ context: CONTEXT });

      const indexTsContents = String(
        proxy.getWrittenContents({ relativePath: PathSegmentStub({ value: 'src/index.ts' }) }),
      );

      expect(indexTsContents).toBe(
        `/**
 * PURPOSE: The starter surface for this \`hydration-recipes\` package — the three names
 * \`recipesConventionStatics.exports\` requires (\`@dungeonmaster/shared/statics\`), so
 * \`dungeonmaster siegelense recipes\` answers with an empty listing the moment this package is
 * built, instead of throwing \`RecipesBuildMissingError\`. Add a recipe under a sibling
 * \`src/recipes-<name>/\` folder and wire it into ${recipesConventionStatics.exports.listing}'s
 * return array and ${recipesConventionStatics.exports.seed}'s dispatch.
 *
 * USAGE:
 * ${recipesConventionStatics.exports.listing}();
 * // Returns []
 */

export const ${recipesConventionStatics.exports.listing} = (): readonly never[] => [];

export const ${recipesConventionStatics.exports.manifest}: readonly never[] =
  ${recipesConventionStatics.exports.listing}();

export const ${recipesConventionStatics.exports.seed} = async (
  _params: Record<string, unknown>,
): Promise<never> => {
  throw new Error(
    'no recipes defined yet — add one under packages/hydration-recipes/src/recipes-<name>/',
  );
};
`,
      );
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
          'Created packages/hydration-recipes/ (package.json, tsconfig.json, tsconfig.build.json, src/index.ts)',
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
          'Created packages/hydration-recipes/ (package.json, tsconfig.json, tsconfig.build.json, src/index.ts); ' +
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
          'Created packages/hydration-recipes/ (package.json, tsconfig.json, tsconfig.build.json, src/index.ts); ' +
          'npm run build --workspace=hydration-recipes failed (exit 1): error TS2307: Cannot find module — run ' +
          '"npm run build --workspace=hydration-recipes" to finish setting it up',
      });
    });
  });
});
