/**
 * PURPOSE: The exact config a workspace package in this monorepo needs, taken from what the
 * packages on disk actually carry rather than from the prose in `packages/CLAUDE.md` — the two
 * disagree in ways that break a build. Reach for this over `tsconfigTemplateStatics` /
 * `jestConfigTemplateStatics`, which are the ROOT-level files `dungeonmaster init` writes into a
 * consumer repo; these are the PER-PACKAGE ones `dungeonmaster create-package` writes.
 *
 * Three values here are the ones a hand-copied config gets wrong, and each cost something real:
 * `buildExclude` omitting `**\/*.stub.ts` / `**\/*.harness.ts` ships test scaffolding inside `dist`;
 * omitting `tsBuildInfoFile` leaves every package's `build:clean` deleting a file the build never
 * wrote; and a jest config that pins its own `testEnvironmentOptions` loses the repo-root base's
 * `customExportConditions: ['source', ...]`, which is what makes a suite read a sibling package's
 * edited TypeScript instead of its last build — so it goes green over stale code and says nothing.
 *
 * A fourth: `jestConfigNode` alone leaves a scaffolded package unable to run an integration test
 * importing `@dungeonmaster/testing` — its root barrel pulls in msw's ESM, and jest's default
 * `transformIgnorePatterns` skips all of `node_modules` while the base `transform` matches only
 * `.ts`. Verified directly (three scratch jest runs against the same test file): setting only
 * `transformIgnorePatterns` still throws `SyntaxError: Unexpected token 'export'` from
 * `until-async`/`msw`, and so does setting only the widened `transform` — both fields are
 * independently required. `jestConfigNodeIntegration` carries the pair every real package on disk
 * that imports `@dungeonmaster/testing`'s root barrel already hand-carries; the transformer picks
 * it over `jestConfigNode` for a seed whose `needsMswTransform` is true.
 *
 * `jestConfigNodePublished` / `jestConfigTsxPublished` are the same two shapes for a CONSUMER repo,
 * which has no `jest.config.base.js` at its root (only this checkout does) — the responder picks
 * these when that file is absent, and picks the pair above when it is present. The published
 * `@dungeonmaster/testing/jest-config-base` already makes every `node_modules` `[cm]?js` file eligible
 * with no per-library ignore list (see that file's own header), so ONE node template covers what
 * `jestConfigNode` and `jestConfigNodeIntegration` split in two internally. The tsx variant keeps
 * that base's keys and adds own-source `tsx`/`jsx` by reading the tuple back OFF the spread base's own `transform`
 * object (`Object.values(base.transform)[0]`) rather than requiring `./ts-jest/published-options.js`
 * directly — `@dungeonmaster/testing`'s `package.json` `exports` map has no subpath for it, so an
 * external `require` of that path 404s under Node's own resolution.
 *
 * A fifth: both tsx templates' `setupFiles` carries `__SETUP_FILES__`, substituted with the jsdom
 * polyfill path only for a `tsx-jsdom` seed (frontend-react) and left an empty, harmless `[]` for
 * `tsx-node` (frontend-ink, testEnvironment 'node'). `@dungeonmaster/testing`'s base loads MSW in
 * `setupFilesAfterEnv` unconditionally, and jest-environment-jsdom forwards none of Node's
 * Request/Response/fetch globals into the jsdom sandbox — without the polyfill, EVERY test file in
 * a scaffolded frontend-react package throws `ReferenceError: Request is not defined` before a
 * single assertion runs (confirmed against a real packed-and-installed consumer, item G27).
 *
 * USAGE:
 * packageScaffoldConfigStatics.buildCompilerOptions;
 * // Returns the compilerOptions block for a package's tsconfig.build.json
 */

export const packageScaffoldConfigStatics = {
  jsonIndentSpaces: 2,
  defaultPackagesDir: 'packages',
  workspaceDependencyVersion: '*',
  packageVersion: '0.1.0',

  tsconfigExtends: '../../tsconfig.json',
  buildTsconfigExtends: './tsconfig.json',

  buildTsconfigFileName: 'tsconfig.build.json',
  jestConfigFileName: 'jest.config.js',
  playwrightConfigFileName: 'playwright.config.ts',

  // Two entries, in this order, in every package on disk. `packages/mcp` adds a third for its own
  // package-local `@types/`; a fresh package has none, so it gets the pair.
  typeRoots: ['../../node_modules/@types', '../../@types'],

  // The include globs every package shares. A type that ships binaries adds `bin/**/*`, and an
  // e2e-eligible type adds its playwright config — both handled by the caller, not here.
  baseInclude: ['src/**/*', 'test/**/*', '*.ts'],

  buildCompilerOptions: {
    noEmit: false,
    rootDir: './',
    outDir: './dist',
    declaration: true,
    declarationMap: true,
    incremental: true,
    tsBuildInfoFile: './.ward/build.tsbuildinfo',
    // `gateway-dist` first: TypeScript never counts a file reached through `#gateway` as a library,
    // so reading a gateway's source here would compile it into this package's `dist`. Its `.d.ts`
    // is never emitted. An unbuilt gateway falls through to `source`.
    customConditions: ['gateway-dist', 'source'],
  },

  // `test/**` alone would not do it: the emit walks `include`, and a `.stub.ts` or `.harness.ts`
  // colocated under `src/` is reached from there.
  buildExclude: [
    '**/*.test.ts',
    '**/*.test.tsx',
    '**/*.proxy.ts',
    '**/*.stub.ts',
    '**/*.harness.ts',
    'test/**',
    'src/.test-tmp/**',
    'src/_lint-testbed/**',
  ],

  scripts: {
    build: 'tsc -p tsconfig.build.json',
    'build:clean': 'rm -rf dist .ward/build.tsbuildinfo && npm run build',
    test: 'dungeonmaster-ward --only test',
    typecheck: 'dungeonmaster-ward --only typecheck',
    lint: 'dungeonmaster-ward --only lint',
    ward: 'dungeonmaster-ward',
  },

  binPostbuildScript: 'chmod +x dist/bin/*.js 2>/dev/null || true',

  publishConfig: { access: 'public' },
  files: ['dist/**/*'],

  devDependencies: {
    '@types/node': '^20.11.0',
    typescript: '^5.3.3',
  },

  // A node-environment package. No `setupFilesAfterEnv` override: object spread REPLACES an array
  // rather than merging it, and the repo-root base already carries the pair a scaffolded package
  // needs (`jest.setup.js` plus T01's `start-endpoint-mock-setup.ts`, which is what fails a test on
  // anything MSW was not told to expect) — restating even one entry here silently drops the other.
  jestConfigNode: `const baseConfig = require('../../jest.config.base.js');

module.exports = {
  ...baseConfig,
  roots: [__ROOTS__],
};
`,

  // The node-environment variant for a seed whose files import '@dungeonmaster/testing' — its
  // root barrel pulls in msw (ESM). `transformIgnorePatterns` alone does nothing here: the base
  // `transform` matches only '.ts', so an un-ignored '.js' file under node_modules/msw still reaches
  // jest untransformed and throws "SyntaxError: Unexpected token 'export'". The widened `transform`
  // below is what actually converts it; both fields are required together, matching every real
  // package on disk that carries this pair (packages/cli, packages/orchestrator, and others). No
  // `setupFilesAfterEnv` override, for the same reason `jestConfigNode` carries none: restating it
  // would replace, not merge, the base's array and drop T01's MSW setup file.
  jestConfigNodeIntegration: `const baseConfig = require('../../jest.config.base.js');
const dungeonmasterTsJestOptions = require('../../packages/testing/ts-jest/options.js');

module.exports = {
  ...baseConfig,
  roots: [__ROOTS__],
  transformIgnorePatterns: ['/dist/', '/node_modules/(?!(msw|@mswjs|until-async|outvariant)/)'],
  transform: {
    '^.+\\\\.[jt]s$': ['ts-jest', dungeonmasterTsJestOptions],
  },
};
`,

  // A package with .tsx sources. The repo-root base transforms '^.+\\.ts$' only, so a widget file
  // reaches jest untransformed without this block. `testEnvironmentOptions` is deliberately NOT
  // restated: spreading the base is what carries `customExportConditions`, and pinning it here
  // would drop the `source` condition. Reusing the shared options entry (rather than restating
  // module/moduleResolution/etc. a third time) also pulls in `isolatedModules: true` for a JSX
  // scaffold — see this file's PURPOSE header for why that pairing is a deliberate tradeoff, not an
  // oversight. `setupFilesAfterEnv` is left unrestated for the same reason: object spread replaces
  // the base's array wholesale, so pinning it here would drop T01's MSW setup file.
  // `transformIgnorePatterns` un-ignores the same four node_modules packages
  // `jestConfigNodeIntegration` does: under testEnvironment 'jsdom', MSW's node setup also wires
  // jsdom's own `XMLHttpRequest` global, which pulls in an ESM `.mjs` file from
  // @mswjs/interceptors' browser build — left ignored (the repo-root base sets no
  // `transformIgnorePatterns` of its own, so this template would otherwise fall back to jest's
  // default `/node_modules/` blanket ignore), that file reaches Node's CJS loader raw and throws
  // "Must use import to load ES Module" (confirmed directly against a real packed-and-installed
  // consumer, item G27). The second `transform` key is what then actually converts it.
  jestConfigTsx: `const baseConfig = require('../../jest.config.base.js');
const dungeonmasterTsJestOptions = require('../../packages/testing/ts-jest/options.js');

module.exports = {
  ...baseConfig,
  preset: undefined,
  testEnvironment: '__TEST_ENVIRONMENT__',
  roots: [__ROOTS__],
  setupFiles: [__SETUP_FILES__],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  testMatch: ['**/src/**/*.test.[jt]s?(x)'],
  transformIgnorePatterns: ['/dist/', '/node_modules/(?!(msw|@mswjs|until-async|outvariant)/)'],
  transform: {
    '^.+\\\\.[jt]sx?$': [
      'ts-jest',
      {
        ...dungeonmasterTsJestOptions,
        tsconfig: { ...dungeonmasterTsJestOptions.tsconfig, jsx: 'react-jsx' },
      },
    ],
    '/node_modules/.+\\\\.[cm]?js$': ['ts-jest', dungeonmasterTsJestOptions],
  },
};
`,

  // The published-base sibling of `jestConfigNode` (and of `jestConfigNodeIntegration`, which a
  // consumer needs no separate variant for — see this file's PURPOSE header). No
  // `setupFilesAfterEnv` override: unlike the repo-internal base above, the published base already
  // wires its own `jest.setup.js` + `start-endpoint-mock-setup.ts` pair, and restating the array here
  // would only risk dropping one of them.
  jestConfigNodePublished: `const base = require('@dungeonmaster/testing/jest-config-base');

module.exports = {
  ...base,
  roots: [__ROOTS__],
};
`,

  // The published-base sibling of `jestConfigTsx`. `tsJestEntry` is read back off the spread base's
  // own `transform` value rather than required directly, because `@dungeonmaster/testing`'s
  // `package.json` `exports` carries no `./ts-jest/*` subpath for an outside `require` to reach.
  // `transform` spreads the base's OWN keys first and adds the own-source `[jt]sx?` key after them.
  // Jest uses the FIRST key that matches, in object order, so a `node_modules` file still reaches
  // the base's `node_modules` rule — `node-modules-transformer.js`, which sends ESM through ts-jest
  // (the ESM `.mjs` file @mswjs/interceptors' browser build pulls in under jsdom, item G27) and hands
  // CommonJS back uncompiled. The added key also excludes `node_modules` itself, so it cannot shadow
  // that rule even if the base's key order changes: without that, every CommonJS dependency's `.js`
  // goes through ts-jest's compile on a cold cache.
  jestConfigTsxPublished: `const base = require('@dungeonmaster/testing/jest-config-base');
const tsJestEntry = Object.values(base.transform)[0];

module.exports = {
  ...base,
  testEnvironment: '__TEST_ENVIRONMENT__',
  roots: [__ROOTS__],
  setupFiles: [__SETUP_FILES__],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'mjs', 'json'],
  testMatch: ['**/src/**/*.test.[jt]s?(x)'],
  transform: {
    ...base.transform,
    '^(?!.*/node_modules/).+\\\\.[jt]sx?$': tsJestEntry,
  },
};
`,

  jestRootsPlaceholder: '__ROOTS__',
  jestTestEnvironmentPlaceholder: '__TEST_ENVIRONMENT__',
  // Always present in both tsx templates so `setupFiles: []` is a harmless no-op for
  // frontend-ink (testEnvironment 'node', where Node's own Request/fetch globals already exist) —
  // only frontend-react's 'tsx-jsdom' kind substitutes the polyfill path in here.
  jestSetupFilesPlaceholder: '__SETUP_FILES__',
  jestRootSrc: "'<rootDir>/src'",
  jestRootBin: "'<rootDir>/bin'",
  jestEnvironmentJsdom: 'jsdom',
  jestEnvironmentNode: 'node',
  jestJsdomSetupFilesEntry: "'@dungeonmaster/testing/jsdom-polyfills'",
} as const;
