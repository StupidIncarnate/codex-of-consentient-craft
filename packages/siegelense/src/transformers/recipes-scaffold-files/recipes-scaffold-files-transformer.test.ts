import { PackageNameStub } from '@dungeonmaster/shared/contracts';
import { locationsStatics, recipesConventionStatics } from '@dungeonmaster/shared/statics';

import { recipesScaffoldFilesTransformer } from './recipes-scaffold-files-transformer';

describe('recipesScaffoldFilesTransformer', () => {
  describe('the file list', () => {
    it('VALID: {packageName: "@acme/hydration-recipes"} => returns package.json, tsconfig.json, tsconfig.build.json, src/index.ts, src/index.test.ts, in that order', () => {
      const packageName = PackageNameStub({ value: '@acme/hydration-recipes' });

      const result = recipesScaffoldFilesTransformer({ packageName });

      expect(result.map((file) => file.relativePath)).toStrictEqual([
        'package.json',
        locationsStatics.repoRoot.tsconfig,
        'tsconfig.build.json',
        'src/index.ts',
        'src/index.test.ts',
      ]);
    });
  });

  describe('package.json', () => {
    it('VALID: {packageName: "@acme/hydration-recipes"} => a buildable package.json naming that scope', () => {
      const packageName = PackageNameStub({ value: '@acme/hydration-recipes' });

      const [packageJsonFile] = recipesScaffoldFilesTransformer({ packageName });

      expect(JSON.parse(packageJsonFile.contents)).toStrictEqual({
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

    it('VALID: {packageName: "hydration-recipes"} => an unscoped package.json when no scope was detected', () => {
      const packageName = PackageNameStub({ value: 'hydration-recipes' });

      const [packageJsonFile] = recipesScaffoldFilesTransformer({ packageName });

      expect(JSON.parse(packageJsonFile.contents)).toStrictEqual({
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

  describe('tsconfig.json', () => {
    it('VALID: {} => extends the repo root tsconfig and includes only src/', () => {
      const packageName = PackageNameStub({ value: '@acme/hydration-recipes' });

      const [, tsconfigFile] = recipesScaffoldFilesTransformer({ packageName });

      expect(JSON.parse(tsconfigFile.contents)).toStrictEqual({
        extends: '../../tsconfig.json',
        compilerOptions: {
          typeRoots: ['../../node_modules/@types', '../../@types'],
        },
        include: ['src/**/*'],
      });
    });
  });

  describe('tsconfig.build.json', () => {
    it('VALID: {} => compiles src/index.ts down to dist/index.js', () => {
      const packageName = PackageNameStub({ value: '@acme/hydration-recipes' });

      const [, , tsconfigBuildFile] = recipesScaffoldFilesTransformer({ packageName });

      expect(JSON.parse(tsconfigBuildFile.contents)).toStrictEqual({
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
  });

  describe('src/index.ts', () => {
    it('VALID: {} => exports the three names recipesConventionStatics.exports requires', () => {
      const packageName = PackageNameStub({ value: '@acme/hydration-recipes' });

      const [, , , indexTsFile] = recipesScaffoldFilesTransformer({ packageName });

      expect(indexTsFile.contents).toBe(
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

  describe('src/index.test.ts', () => {
    it('VALID: {} => proves the listing is empty and the seed throws', () => {
      const packageName = PackageNameStub({ value: '@acme/hydration-recipes' });

      const [, , , , indexTestTsFile] = recipesScaffoldFilesTransformer({ packageName });

      expect(indexTestTsFile.contents).toBe(
        `import {
  ${recipesConventionStatics.exports.manifest},
  ${recipesConventionStatics.exports.listing},
  ${recipesConventionStatics.exports.seed},
} from './index';

describe('hydration-recipes starter index', () => {
  it('VALID: {} => ${recipesConventionStatics.exports.listing} returns an empty array', () => {
    expect(${recipesConventionStatics.exports.listing}()).toStrictEqual([]);
  });

  it('VALID: {} => ${recipesConventionStatics.exports.manifest} is an empty array', () => {
    expect(${recipesConventionStatics.exports.manifest}).toStrictEqual([]);
  });

  it('ERROR: {seed request} => ${recipesConventionStatics.exports.seed} rejects naming where to add a recipe', async () => {
    await expect(${recipesConventionStatics.exports.seed}({})).rejects.toThrow(
      /no recipes defined yet/u,
    );
  });
});
`,
      );
    });
  });
});
