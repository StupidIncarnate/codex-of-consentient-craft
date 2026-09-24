/**
 * PURPOSE: The complete, minimal file set `InstallRecipesScaffoldResponder` writes for a FRESH
 * `hydration-recipes` package — one `npm run build` can actually act on, unlike a bare `src/` folder
 * with no `package.json`. Mirrors the shape this repo's own `packages/hydration-recipes` carries (a
 * package.json/tsconfig.json/tsconfig.build.json trio plus a source entry that compiles down to
 * `dist/index.js`, the exact path `recipesConventionStatics.entry.distRelativePath` names), scaled
 * down to a package with no domain folders yet. Kept in `siegelense` rather than reused from
 * `@dungeonmaster/cli`'s own `packageScaffoldFilesTransformer` — this scaffolder targets one fixed,
 * narrow package shape and the two scaffolders stay independently owned
 * (`siegelense-consumer-lanes.md`, section 3.6).
 *
 * USAGE:
 * recipesScaffoldFilesTransformer({ packageName: PackageNameStub({ value: '@acme/hydration-recipes' }) });
 * // Returns 5 RecipesScaffoldFile entries: package.json, tsconfig.json, tsconfig.build.json,
 * // src/index.ts, src/index.test.ts
 */

import { fileContentsContract, pathSegmentContract } from '@dungeonmaster/shared/contracts';
import type { PackageName } from '@dungeonmaster/shared/contracts';
import { locationsStatics, recipesConventionStatics } from '@dungeonmaster/shared/statics';

import { recipesScaffoldFileContract } from '../../contracts/recipes-scaffold-file/recipes-scaffold-file-contract';
import type { RecipesScaffoldFile } from '../../contracts/recipes-scaffold-file/recipes-scaffold-file-contract';

const JSON_INDENT_SPACES = 2;
const PACKAGE_VERSION = '0.1.0';
const NO_RECIPES_MESSAGE =
  'no recipes defined yet — add one under packages/hydration-recipes/src/recipes-<name>/';

export const recipesScaffoldFilesTransformer = ({
  packageName,
}: {
  packageName: PackageName;
}): readonly [
  RecipesScaffoldFile,
  RecipesScaffoldFile,
  RecipesScaffoldFile,
  RecipesScaffoldFile,
  RecipesScaffoldFile,
] => {
  const packageJson = {
    name: packageName,
    version: PACKAGE_VERSION,
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
  };

  const tsconfigJson = {
    extends: '../../tsconfig.json',
    compilerOptions: {
      typeRoots: ['../../node_modules/@types', '../../@types'],
    },
    include: ['src/**/*'],
  };

  const tsconfigBuildJson = {
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
  };

  const indexTs = `/**
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
    '${NO_RECIPES_MESSAGE}',
  );
};
`;

  const indexTestTs = `import {
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
`;

  return [
    recipesScaffoldFileContract.parse({
      relativePath: pathSegmentContract.parse('package.json'),
      contents: fileContentsContract.parse(
        `${JSON.stringify(packageJson, null, JSON_INDENT_SPACES)}\n`,
      ),
    }),
    recipesScaffoldFileContract.parse({
      relativePath: pathSegmentContract.parse(locationsStatics.repoRoot.tsconfig),
      contents: fileContentsContract.parse(
        `${JSON.stringify(tsconfigJson, null, JSON_INDENT_SPACES)}\n`,
      ),
    }),
    recipesScaffoldFileContract.parse({
      relativePath: pathSegmentContract.parse('tsconfig.build.json'),
      contents: fileContentsContract.parse(
        `${JSON.stringify(tsconfigBuildJson, null, JSON_INDENT_SPACES)}\n`,
      ),
    }),
    recipesScaffoldFileContract.parse({
      relativePath: pathSegmentContract.parse('src/index.ts'),
      contents: fileContentsContract.parse(indexTs),
    }),
    recipesScaffoldFileContract.parse({
      relativePath: pathSegmentContract.parse('src/index.test.ts'),
      contents: fileContentsContract.parse(indexTestTs),
    }),
  ];
};
