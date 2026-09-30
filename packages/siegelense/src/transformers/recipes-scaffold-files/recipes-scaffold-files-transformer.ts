/**
 * PURPOSE: The complete, minimal file set `InstallRecipesScaffoldResponder` writes for a FRESH
 * `hydration-recipes` package — one `npm run build` can actually act on, unlike a bare `src/` folder
 * with no `package.json`, and one `@dungeonmaster/enforce-hydration-recipes-structure` (this repo's
 * own lint rule) accepts outright rather than flagging as an incomplete package. That rule requires
 * five files to exist regardless of a package's maturity — a startup file, a flow, a responders
 * barrel, and two responders — so the starter mirrors this repo's OWN `packages/hydration-recipes`
 * layering (startup delegates to a flow, a flow delegates to responders) at the smallest size that
 * satisfies it: the listing responder always returns `[]` and the seed responder always throws,
 * until a real recipe is added and wired in. Mirrors the shape this repo's own
 * `packages/hydration-recipes` carries (a package.json/tsconfig.json/tsconfig.build.json/
 * jest.config.js quartet plus a source entry that compiles down to `dist/index.js`, the exact path
 * `recipesConventionStatics.entry.distRelativePath` names), scaled down to a package with no domain
 * recipes yet. Kept in `siegelense` rather than reused from `@dungeonmaster/cli`'s own
 * `packageScaffoldFilesTransformer` — this scaffolder targets one fixed, narrow package shape and
 * the two scaffolders stay independently owned (`siegelense-consumer-lanes.md`, section 3.6). The
 * package.json declares its own `#gateway/*` `imports` field here, at scaffold time, through the
 * SAME `gatewayImportsFieldTransformer` cli's `init` gateway step and `create-package` use — this
 * package cannot wait for that step to find it on disk, because the gateway step scans `packages/*`
 * once, before this scaffolder ever runs. `jest.config.js` always requires the PUBLISHED
 * `@dungeonmaster/testing/jest-config-base` — this scaffolder only ever creates a package inside a
 * real consumer repo (THIS checkout's own `packages/hydration-recipes` already exists and is never
 * re-scaffolded), so there is no repo-root `jest.config.base.js` to require instead.
 *
 * USAGE:
 * recipesScaffoldFilesTransformer({ packageName: PackageNameStub({ value: '@acme/hydration-recipes' }), scope: PathSegmentStub({ value: '@acme' }) });
 * // Returns the ordered RecipesScaffoldFile[]: package.json, tsconfig.json, tsconfig.build.json,
 * // jest.config.js, src/responders/responders.ts, src/index.ts, src/index.integration.test.ts, a startup file
 * // (plus its integration test), a flow (plus its integration test), and two responders (each with
 * // a proxy and a unit test)
 */

import { pathSegmentContract } from '@dungeonmaster/shared/contracts';
import type { PackageName, PathSegment } from '@dungeonmaster/shared/contracts';
import { locationsStatics, recipesConventionStatics } from '@dungeonmaster/shared/statics';
import { gatewayImportsFieldTransformer } from '@dungeonmaster/shared/transformers';

import { recipesScaffoldFileContract } from '../../contracts/recipes-scaffold-file/recipes-scaffold-file-contract';
import type { RecipesScaffoldFile } from '../../contracts/recipes-scaffold-file/recipes-scaffold-file-contract';

const JSON_INDENT_SPACES = 2;
const PACKAGE_VERSION = '0.1.0';
const NO_RECIPES_MESSAGE =
  'no recipes defined yet — add one under packages/hydration-recipes/src/recipes-<name>/';

const LISTING_EXPORT = recipesConventionStatics.exports.listing;
const SEED_EXPORT = recipesConventionStatics.exports.seed;
const MANIFEST_EXPORT = recipesConventionStatics.exports.manifest;

export const recipesScaffoldFilesTransformer = ({
  packageName,
  scope,
}: {
  packageName: PackageName;
  scope?: PathSegment;
}): readonly RecipesScaffoldFile[] => {
  const packageJson = {
    name: packageName,
    version: PACKAGE_VERSION,
    description: 'hydration-recipes package',
    private: true,
    ...(scope === undefined ? {} : { imports: gatewayImportsFieldTransformer({ scope }) }),
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
      '**/*.integration.test.ts',
      '**/*.proxy.ts',
      '**/*.stub.ts',
      '**/*.harness.ts',
      'src/.test-tmp/**',
      'src/_lint-testbed/**',
    ],
  };

  const jestConfigJs = `const base = require('@dungeonmaster/testing/jest-config-base');

module.exports = {
  ...base,
  roots: ['<rootDir>/src'],
};
`;

  // `@dungeonmaster/enforce-hydration-recipes-structure` (this repo's own architectural lint rule)
  // requires this exact path to exist, so `dungeonmaster siegelense recipes`'s own consumer
  // scaffold lints clean instead of reporting five missing-structure violations.
  const respondersTs = `/**
 * PURPOSE: Barrel exporting all responders declared by this package.
 *
 * USAGE:
 * import {
 *   ${LISTING_EXPORT},
 *   ${SEED_EXPORT},
 * } from '<packageName>/responders';
 */

export * from './recipes/listing/recipes-listing-responder';
export * from './recipes/seed/recipes-seed-responder';
`;

  const listingResponderTs = `/**
 * PURPOSE: Answers the recipe listing \`dungeonmaster siegelense recipes\` reads — starts empty
 * until a real recipe is added under a sibling \`src/recipes-<name>/\` folder and wired into this
 * responder's own return array.
 *
 * USAGE:
 * ${LISTING_EXPORT}();
 * // Returns []
 */

export const ${LISTING_EXPORT} = (): readonly never[] => [];
`;

  const listingResponderProxyTs = `export const ${LISTING_EXPORT}Proxy = (): Record<PropertyKey, never> => ({});
`;

  const listingResponderTestTs = `import { ${LISTING_EXPORT} } from './recipes-listing-responder';
import { ${LISTING_EXPORT}Proxy } from './recipes-listing-responder.proxy';

describe('${LISTING_EXPORT}', () => {
  it('VALID: {} => returns an empty array', () => {
    ${LISTING_EXPORT}Proxy();

    expect(${LISTING_EXPORT}()).toStrictEqual([]);
  });
});
`;

  const seedResponderTs = `/**
 * PURPOSE: Answers a recipe seed request — throws until a real recipe is added under a sibling
 * \`src/recipes-<name>/\` folder and wired into this responder's own dispatch.
 *
 * USAGE:
 * ${SEED_EXPORT}({});
 * // Throws: no recipes defined yet
 */

const NO_RECIPES_MESSAGE =
  '${NO_RECIPES_MESSAGE}';

export const ${SEED_EXPORT} = ({
  recipeName: _recipeName,
}: Record<string, unknown>): never => {
  throw new Error(NO_RECIPES_MESSAGE);
};
`;

  const seedResponderProxyTs = `export const ${SEED_EXPORT}Proxy = (): Record<PropertyKey, never> => ({});
`;

  const seedResponderTestTs = `import { ${SEED_EXPORT} } from './recipes-seed-responder';
import { ${SEED_EXPORT}Proxy } from './recipes-seed-responder.proxy';

describe('${SEED_EXPORT}', () => {
  it('ERROR: {seed request} => throws naming where to add a recipe', () => {
    ${SEED_EXPORT}Proxy();

    expect(() => ${SEED_EXPORT}({})).toThrow(/no recipes defined yet/u);
  });
});
`;

  const recipesFlowTs = `/**
 * PURPOSE: Orchestrates recipe operations by delegating to recipe responders. Entry point for
 * recipe flows across this package.
 *
 * USAGE:
 * const listing = RecipesFlow.listing();
 * RecipesFlow.seed({});
 */

import { ${LISTING_EXPORT} } from '../../responders/recipes/listing/recipes-listing-responder';
import { ${SEED_EXPORT} } from '../../responders/recipes/seed/recipes-seed-responder';

type ListingResult = ReturnType<typeof ${LISTING_EXPORT}>;
type SeedParams = Parameters<typeof ${SEED_EXPORT}>[0];
type SeedResult = ReturnType<typeof ${SEED_EXPORT}>;

export const RecipesFlow = {
  listing: (): ListingResult => ${LISTING_EXPORT}(),

  seed: (params: SeedParams): SeedResult => ${SEED_EXPORT}(params),
};
`;

  const recipesFlowIntegrationTestTs = `import { RecipesFlow } from './recipes-flow';

describe('RecipesFlow', () => {
  it('VALID: {} => listing returns an empty array', () => {
    expect(RecipesFlow.listing()).toStrictEqual([]);
  });

  it('ERROR: {seed request} => throws naming where to add a recipe', () => {
    expect(() => RecipesFlow.seed({})).toThrow(/no recipes defined yet/u);
  });
});
`;

  const startHydrationRecipesTs = `/**
 * PURPOSE: Application initialization and public API entry point for this package. Wires up
 * recipe flows for listing and seeding.
 *
 * USAGE:
 * import { StartHydrationRecipes } from '<packageName>';
 * const listing = StartHydrationRecipes.listing();
 * StartHydrationRecipes.seed({});
 */

import { RecipesFlow } from '../flows/recipes/recipes-flow';

type ListingResult = ReturnType<typeof RecipesFlow.listing>;
type SeedParams = Parameters<typeof RecipesFlow.seed>[0];
type SeedResult = ReturnType<typeof RecipesFlow.seed>;

export const StartHydrationRecipes = {
  listing: (): ListingResult => RecipesFlow.listing(),

  seed: (params: SeedParams): SeedResult => RecipesFlow.seed(params),
};
`;

  const startHydrationRecipesIntegrationTestTs = `import { StartHydrationRecipes } from './start-hydration-recipes';

describe('StartHydrationRecipes', () => {
  it('VALID: {} => listing returns an empty array', () => {
    expect(StartHydrationRecipes.listing()).toStrictEqual([]);
  });

  it('ERROR: {seed request} => throws naming where to add a recipe', () => {
    expect(() => StartHydrationRecipes.seed({})).toThrow(/no recipes defined yet/u);
  });
});
`;

  const indexTs = `/**
 * PURPOSE: The starter surface for this \`hydration-recipes\` package — the three names
 * \`recipesConventionStatics.exports\` requires (\`@dungeonmaster/shared/statics\`), so
 * \`dungeonmaster siegelense recipes\` answers with an empty listing the moment this package is
 * built, instead of throwing \`RecipesBuildMissingError\`. Add a recipe under a sibling
 * \`src/recipes-<name>/\` folder and wire it into \`StartHydrationRecipes.listing\`'s return array
 * and \`StartHydrationRecipes.seed\`'s dispatch.
 *
 * USAGE:
 * ${LISTING_EXPORT}();
 * // Returns []
 */

import { StartHydrationRecipes } from './startup/start-hydration-recipes';

export const ${LISTING_EXPORT} = (): ReturnType<typeof StartHydrationRecipes.listing> =>
  StartHydrationRecipes.listing();

export const ${SEED_EXPORT} = (
  { ...params }: Parameters<typeof StartHydrationRecipes.seed>[0],
): ReturnType<typeof StartHydrationRecipes.seed> => StartHydrationRecipes.seed(params);

export const ${MANIFEST_EXPORT}: readonly never[] = [];
`;

  const indexIntegrationTestTs = `import { ${LISTING_EXPORT}, ${SEED_EXPORT}, ${MANIFEST_EXPORT} } from './index';

describe('hydration-recipes starter index', () => {
  it('VALID: {} => ${LISTING_EXPORT} returns an empty array', () => {
    expect(${LISTING_EXPORT}()).toStrictEqual([]);
  });

  it('VALID: {} => ${MANIFEST_EXPORT} is an empty array', () => {
    expect(${MANIFEST_EXPORT}).toStrictEqual([]);
  });

  it('ERROR: {seed request} => ${SEED_EXPORT} throws naming where to add a recipe', () => {
    expect(() => ${SEED_EXPORT}({})).toThrow(/no recipes defined yet/u);
  });
});
`;

  const plannedFiles = [
    {
      relativePath: 'package.json',
      contents: `${JSON.stringify(packageJson, null, JSON_INDENT_SPACES)}\n`,
    },
    {
      relativePath: locationsStatics.repoRoot.tsconfig,
      contents: `${JSON.stringify(tsconfigJson, null, JSON_INDENT_SPACES)}\n`,
    },
    {
      relativePath: 'tsconfig.build.json',
      contents: `${JSON.stringify(tsconfigBuildJson, null, JSON_INDENT_SPACES)}\n`,
    },
    { relativePath: 'jest.config.js', contents: jestConfigJs },
    { relativePath: 'src/responders/responders.ts', contents: respondersTs },

    {
      relativePath: 'src/responders/recipes/listing/recipes-listing-responder.ts',
      contents: listingResponderTs,
    },
    {
      relativePath: 'src/responders/recipes/listing/recipes-listing-responder.proxy.ts',
      contents: listingResponderProxyTs,
    },
    {
      relativePath: 'src/responders/recipes/listing/recipes-listing-responder.test.ts',
      contents: listingResponderTestTs,
    },
    {
      relativePath: 'src/responders/recipes/seed/recipes-seed-responder.ts',
      contents: seedResponderTs,
    },
    {
      relativePath: 'src/responders/recipes/seed/recipes-seed-responder.proxy.ts',
      contents: seedResponderProxyTs,
    },
    {
      relativePath: 'src/responders/recipes/seed/recipes-seed-responder.test.ts',
      contents: seedResponderTestTs,
    },
    { relativePath: 'src/flows/recipes/recipes-flow.ts', contents: recipesFlowTs },
    {
      relativePath: 'src/flows/recipes/recipes-flow.integration.test.ts',
      contents: recipesFlowIntegrationTestTs,
    },
    {
      relativePath: 'src/startup/start-hydration-recipes.ts',
      contents: startHydrationRecipesTs,
    },
    {
      relativePath: 'src/startup/start-hydration-recipes.integration.test.ts',
      contents: startHydrationRecipesIntegrationTestTs,
    },
    { relativePath: 'src/index.ts', contents: indexTs },
    { relativePath: 'src/index.integration.test.ts', contents: indexIntegrationTestTs },
  ];

  return plannedFiles.map((file) =>
    recipesScaffoldFileContract.parse({
      relativePath: pathSegmentContract.parse(file.relativePath),
      contents: file.contents,
    }),
  );
};
