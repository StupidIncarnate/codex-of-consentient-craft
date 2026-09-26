/**
 * PURPOSE: The exact config a freshly scaffolded gateway package needs, taken from what
 * `packages/@gateway/{npm,node,browser,bin}` already carry in this repo — the version pins a
 * generic `create-package` scaffold would get (`packageScaffoldConfigStatics.devDependencies`)
 * are OLDER than what the real gateway packages pin, so this repeats them rather than reusing that
 * static and drifting from the packages a consumer will actually run `npm install` against.
 *
 * `devDependencies` deliberately OMITS `@dungeonmaster/testing`, unlike this repo's own gateway
 * packages: theirs resolves through THIS monorepo's own workspace symlink, never the public
 * registry, but a freshly scaffolded package in a consumer repo has no such workspace member —
 * `npm install` 404s on it there. A fresh scaffold ships no wrapper module and no test file yet
 * either, so nothing needs it until the consumer adds one.
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
  jestConfigContent: `// Extend shared Jest configuration
const baseConfig = require('../../../jest.config.base.js');

module.exports = {
  ...baseConfig,
};
`,
} as const;
