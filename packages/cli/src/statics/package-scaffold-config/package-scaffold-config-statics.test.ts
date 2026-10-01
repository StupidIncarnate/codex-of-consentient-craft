import { packageScaffoldConfigStatics } from './package-scaffold-config-statics';

describe('packageScaffoldConfigStatics', () => {
  describe('tsconfig values', () => {
    it('VALID: {} => extends the repo root config and points typeRoots at the root pair', () => {
      expect({
        tsconfigExtends: packageScaffoldConfigStatics.tsconfigExtends,
        buildTsconfigExtends: packageScaffoldConfigStatics.buildTsconfigExtends,
        typeRoots: packageScaffoldConfigStatics.typeRoots,
        baseInclude: packageScaffoldConfigStatics.baseInclude,
      }).toStrictEqual({
        tsconfigExtends: '../../tsconfig.json',
        buildTsconfigExtends: './tsconfig.json',
        typeRoots: ['../../node_modules/@types', '../../@types'],
        baseInclude: ['src/**/*', 'test/**/*', '*.ts'],
      });
    });

    it('VALID: {} => build compilerOptions emit declarations and name a .ward tsBuildInfoFile', () => {
      expect(packageScaffoldConfigStatics.buildCompilerOptions).toStrictEqual({
        noEmit: false,
        rootDir: './',
        outDir: './dist',
        declaration: true,
        declarationMap: true,
        incremental: true,
        tsBuildInfoFile: './.ward/build.tsbuildinfo',
        customConditions: ['gateway-dist', 'source'],
      });
    });

    it('VALID: {} => buildExclude drops stubs and harnesses as well as tests and proxies', () => {
      expect(packageScaffoldConfigStatics.buildExclude).toStrictEqual([
        '**/*.test.ts',
        '**/*.test.tsx',
        '**/*.proxy.ts',
        '**/*.stub.ts',
        '**/*.harness.ts',
        'test/**',
        'src/.test-tmp/**',
        'src/_lint-testbed/**',
      ]);
    });
  });

  describe('package.json values', () => {
    it('VALID: {} => scripts route every quality check through ward', () => {
      expect(packageScaffoldConfigStatics.scripts).toStrictEqual({
        build: 'tsc -p tsconfig.build.json',
        'build:clean': 'rm -rf dist .ward/build.tsbuildinfo && npm run build',
        test: 'dungeonmaster-ward --only test',
        typecheck: 'dungeonmaster-ward --only typecheck',
        lint: 'dungeonmaster-ward --only lint',
        ward: 'dungeonmaster-ward',
      });
    });

    it('VALID: {} => carries the publish surface a fresh workspace package needs', () => {
      expect({
        packageVersion: packageScaffoldConfigStatics.packageVersion,
        workspaceDependencyVersion: packageScaffoldConfigStatics.workspaceDependencyVersion,
        defaultPackagesDir: packageScaffoldConfigStatics.defaultPackagesDir,
        jsonIndentSpaces: packageScaffoldConfigStatics.jsonIndentSpaces,
        files: packageScaffoldConfigStatics.files,
        publishConfig: packageScaffoldConfigStatics.publishConfig,
        devDependencies: packageScaffoldConfigStatics.devDependencies,
        binPostbuildScript: packageScaffoldConfigStatics.binPostbuildScript,
      }).toStrictEqual({
        packageVersion: '0.1.0',
        workspaceDependencyVersion: '*',
        defaultPackagesDir: 'packages',
        jsonIndentSpaces: 2,
        files: ['dist/**/*'],
        publishConfig: { access: 'public' },
        devDependencies: { '@types/node': '^20.11.0', typescript: '^5.3.3' },
        binPostbuildScript: 'chmod +x dist/bin/*.js 2>/dev/null || true',
      });
    });
  });

  describe('jest templates', () => {
    it('VALID: {} => the node template spreads the repo-root base rather than the published one', () => {
      expect(packageScaffoldConfigStatics.jestConfigNode).toMatch(
        /^const baseConfig = require\('\.\.\/\.\.\/jest\.config\.base\.js'\);$/mu,
      );
    });

    // F13: object spread REPLACES an array rather than merging it, so restating setupFilesAfterEnv
    // here would drop the repo-root base's start-endpoint-mock-setup.ts entry (T01) and leave a
    // scaffolded package with no MSW fail-on-unhandled guard. Asserting the COMPLETE template
    // catches a restated array a partial `toMatch` would miss.
    it('VALID: {} => the node template body is exactly the spread with no setupFilesAfterEnv override', () => {
      expect(packageScaffoldConfigStatics.jestConfigNode).toBe(
        `const baseConfig = require('../../jest.config.base.js');

module.exports = {
  ...baseConfig,
  roots: [__ROOTS__],
};
`,
      );
    });

    it('VALID: {} => the node-integration template carries no setupFilesAfterEnv override either', () => {
      expect(packageScaffoldConfigStatics.jestConfigNodeIntegration).toBe(
        `const baseConfig = require('../../jest.config.base.js');
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
      );
    });

    it('VALID: {} => the tsx template carries no setupFilesAfterEnv override either', () => {
      expect(packageScaffoldConfigStatics.jestConfigTsx).toBe(
        `const baseConfig = require('../../jest.config.base.js');
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
      );
    });

    it('VALID: {} => the tsx template spreads that same base, which is what carries customExportConditions', () => {
      expect(packageScaffoldConfigStatics.jestConfigTsx).toMatch(
        /^const baseConfig = require\('\.\.\/\.\.\/jest\.config\.base\.js'\);$/mu,
      );
    });

    it('VALID: {} => the node template carries the roots placeholder the transformer substitutes', () => {
      expect(packageScaffoldConfigStatics.jestConfigNode).toMatch(/^ {2}roots: \[__ROOTS__\],$/mu);
    });

    it('VALID: {} => the tsx template carries the roots and testEnvironment placeholders', () => {
      expect(packageScaffoldConfigStatics.jestConfigTsx).toMatch(
        /^ {2}testEnvironment: '__TEST_ENVIRONMENT__',\n {2}roots: \[__ROOTS__\],$/mu,
      );
    });

    it('VALID: {} => the node-integration template requires the shared ts-jest options entry instead of restating it', () => {
      expect(packageScaffoldConfigStatics.jestConfigNodeIntegration).toMatch(
        /^const dungeonmasterTsJestOptions = require\('\.\.\/\.\.\/packages\/testing\/ts-jest\/options\.js'\);$/mu,
      );
    });

    it('VALID: {} => the node-integration template hands the shared options straight to ts-jest, restating no keys', () => {
      expect(packageScaffoldConfigStatics.jestConfigNodeIntegration).toMatch(
        /^ {4}'\^\.\+\\\\\.\[jt\]s\$': \['ts-jest', dungeonmasterTsJestOptions\],$/mu,
      );
    });

    it('VALID: {} => the tsx template requires the shared ts-jest options entry instead of restating it', () => {
      expect(packageScaffoldConfigStatics.jestConfigTsx).toMatch(
        /^const dungeonmasterTsJestOptions = require\('\.\.\/\.\.\/packages\/testing\/ts-jest\/options\.js'\);$/mu,
      );
    });

    it('VALID: {} => the tsx template layers jsx onto the shared options tsconfig rather than restating the whole object', () => {
      expect(packageScaffoldConfigStatics.jestConfigTsx).toMatch(
        /^ {8}\.\.\.dungeonmasterTsJestOptions,\n {8}tsconfig: \{ \.\.\.dungeonmasterTsJestOptions\.tsconfig, jsx: 'react-jsx' \},$/mu,
      );
    });

    it('VALID: {} => the published node template spreads the published testing base, not the repo-root file', () => {
      expect(packageScaffoldConfigStatics.jestConfigNodePublished).toMatch(
        /^const base = require\('@dungeonmaster\/testing\/jest-config-base'\);$/mu,
      );
    });

    it('VALID: {} => the published tsx template spreads that same published base and reads its transform tuple back', () => {
      expect(packageScaffoldConfigStatics.jestConfigTsxPublished).toMatch(
        /^const base = require\('@dungeonmaster\/testing\/jest-config-base'\);\nconst tsJestEntry = Object\.values\(base\.transform\)\[0\];$/mu,
      );
    });

    it('VALID: {} => the published tsx template keeps the base transform keys first and adds a node_modules-excluding tsx/jsx key after them', () => {
      expect(packageScaffoldConfigStatics.jestConfigTsxPublished).toMatch(
        /^ {2}transform: \{\n {4}\.\.\.base\.transform,\n {4}'\^\(\?!\.\*\/node_modules\/\)\.\+\\\\\.\[jt\]sx\?\$': tsJestEntry,\n {2}\},$/mu,
      );
    });

    it('VALID: {} => the placeholder tokens and their substitution values are the ones the transformer uses', () => {
      expect({
        jestRootsPlaceholder: packageScaffoldConfigStatics.jestRootsPlaceholder,
        jestTestEnvironmentPlaceholder: packageScaffoldConfigStatics.jestTestEnvironmentPlaceholder,
        jestSetupFilesPlaceholder: packageScaffoldConfigStatics.jestSetupFilesPlaceholder,
        jestRootSrc: packageScaffoldConfigStatics.jestRootSrc,
        jestRootBin: packageScaffoldConfigStatics.jestRootBin,
        jestEnvironmentJsdom: packageScaffoldConfigStatics.jestEnvironmentJsdom,
        jestEnvironmentNode: packageScaffoldConfigStatics.jestEnvironmentNode,
        jestJsdomSetupFilesEntry: packageScaffoldConfigStatics.jestJsdomSetupFilesEntry,
      }).toStrictEqual({
        jestRootsPlaceholder: '__ROOTS__',
        jestTestEnvironmentPlaceholder: '__TEST_ENVIRONMENT__',
        jestSetupFilesPlaceholder: '__SETUP_FILES__',
        jestRootSrc: "'<rootDir>/src'",
        jestRootBin: "'<rootDir>/bin'",
        jestEnvironmentJsdom: 'jsdom',
        jestEnvironmentNode: 'node',
        jestJsdomSetupFilesEntry: "'@dungeonmaster/testing/jsdom-polyfills'",
      });
    });

    it('VALID: {} => the published tsx template also carries the setupFiles placeholder', () => {
      expect(packageScaffoldConfigStatics.jestConfigTsxPublished).toMatch(
        /^ {2}setupFiles: \[__SETUP_FILES__\],$/mu,
      );
    });
  });

  describe('scaffolded file names', () => {
    it('VALID: {} => names the build tsconfig, jest config and playwright config it writes', () => {
      expect({
        buildTsconfigFileName: packageScaffoldConfigStatics.buildTsconfigFileName,
        jestConfigFileName: packageScaffoldConfigStatics.jestConfigFileName,
        playwrightConfigFileName: packageScaffoldConfigStatics.playwrightConfigFileName,
      }).toStrictEqual({
        buildTsconfigFileName: 'tsconfig.build.json',
        jestConfigFileName: 'jest.config.js',
        playwrightConfigFileName: 'playwright.config.ts',
      });
    });
  });
});
