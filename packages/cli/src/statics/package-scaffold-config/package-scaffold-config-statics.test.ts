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

    it('VALID: {} => the placeholder tokens and their substitution values are the ones the transformer uses', () => {
      expect({
        jestRootsPlaceholder: packageScaffoldConfigStatics.jestRootsPlaceholder,
        jestTestEnvironmentPlaceholder: packageScaffoldConfigStatics.jestTestEnvironmentPlaceholder,
        jestRootSrc: packageScaffoldConfigStatics.jestRootSrc,
        jestRootBin: packageScaffoldConfigStatics.jestRootBin,
        jestEnvironmentJsdom: packageScaffoldConfigStatics.jestEnvironmentJsdom,
        jestEnvironmentNode: packageScaffoldConfigStatics.jestEnvironmentNode,
      }).toStrictEqual({
        jestRootsPlaceholder: '__ROOTS__',
        jestTestEnvironmentPlaceholder: '__TEST_ENVIRONMENT__',
        jestRootSrc: "'<rootDir>/src'",
        jestRootBin: "'<rootDir>/bin'",
        jestEnvironmentJsdom: 'jsdom',
        jestEnvironmentNode: 'node',
      });
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
