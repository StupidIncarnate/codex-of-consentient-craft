/**
 * PURPOSE: The exact config a freshly scaffolded gateway package needs, taken from what
 * `packages/@gateway/{npm,node,browser,bin}` already carry in this repo — the version pins a
 * generic `create-package` scaffold would get (`packageScaffoldConfigStatics.devDependencies`)
 * are OLDER than what the real gateway packages pin, so this repeats them rather than reusing that
 * static and drifting from the packages a consumer will actually run `npm install` against.
 *
 * `devDependencies` deliberately OMITS `@dungeonmaster/testing`, unlike this repo's own gateway
 * packages: `init` already lists it at the consumer's root, and npm hoists it from there to the
 * copied node and browser proxies that import it.
 *
 * The Jest configs spread the PUBLISHED `@dungeonmaster/testing/jest-config-base`, never this
 * repo's root `jest.config.base.js`, which does not exist in a consumer repo. `placeholderContent`
 * is the one input a gateway package with no subpath yet (npm, bin) needs, since `tsc` refuses a
 * config that matches no file at all.
 *
 * USAGE:
 * gatewayPackageTemplateStatics.tsconfigExtends;
 * // Returns '../../../tsconfig.json' — three levels up from packages/@gateway/<folder>/ to the repo root
 */

export const gatewayPackageTemplateStatics = {
  packageVersion: '0.1.0',
  jsonIndentSpaces: 2,
  tsconfigExtends: '../../../tsconfig.json',
  typeRoots: ['../../../node_modules/@types', '../../../@types', './@types'],
  include: ['**/*.ts', '@types/**/*'],
  exclude: ['node_modules', 'dist'],
  buildExclude: ['**/*.test.ts', '**/*.test.tsx', '**/*.harness.ts', '@types/**/*', 'dist'],
  buildCustomConditions: ['gateway-dist', 'source'],
  // The consumer's ROOT tsconfig: node16 reads each package's `imports`/`exports`, which is how
  // `#gateway/<pkg>/<subpath>` resolves; `source` reads the gateway's TypeScript without a build.
  rootCompilerOptions: {
    module: 'node16',
    moduleResolution: 'node16',
    customConditions: ['source'],
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
  jestConfigContent: `const base = require('@dungeonmaster/testing/jest-config-base');

module.exports = {
  ...base,
};
`,
  browserJestConfigContent: `// A jsdom environment: this package wraps browser globals (fetch, localStorage, WebSocket,
// indexedDB, document, ...), none of which exist under the base config's Node environment.
const base = require('@dungeonmaster/testing/jest-config-base');

module.exports = {
  ...base,
  testEnvironment: 'jsdom',
  testEnvironmentOptions: { url: 'http://localhost' },
  setupFiles: ['<rootDir>/__mocks__/jsdom-polyfills.cjs'],
};
`,
  placeholderPath: 'src/index.d.ts',
  placeholderContent: `// Keeps this package compiling while it holds no subpath: tsc refuses a config that matches no
// file. Delete it once the first src/<subpath>/<subpath>.ts exists.
export {};
`,
} as const;
