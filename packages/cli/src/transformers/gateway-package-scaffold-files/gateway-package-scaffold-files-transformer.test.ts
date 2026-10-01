import { gatewayPackageScaffoldFilesTransformer } from './gateway-package-scaffold-files-transformer';

const fileNamed = ({
  files,
  relativePath,
}: {
  files: readonly ReturnType<typeof gatewayPackageScaffoldFilesTransformer>[number][];
  relativePath: string;
}) => files.find((file) => String(file.relativePath) === relativePath);

describe('gatewayPackageScaffoldFilesTransformer', () => {
  it('VALID: {folder: "npm"} => builds the configs plus the placeholder that keeps an empty package compiling', () => {
    const files = gatewayPackageScaffoldFilesTransformer({
      scope: '@acme',
      folder: 'npm',
    });

    expect(files.map((file) => String(file.relativePath))).toStrictEqual([
      'package.json',
      'tsconfig.json',
      'tsconfig.build.json',
      'jest.config.js',
      'src/index.d.ts',
    ]);
  });

  it('VALID: {folder: "node"} => builds only the configs, since its source is copied in', () => {
    const files = gatewayPackageScaffoldFilesTransformer({
      scope: '@acme',
      folder: 'node',
    });

    expect(files.map((file) => String(file.relativePath))).toStrictEqual([
      'package.json',
      'tsconfig.json',
      'tsconfig.build.json',
      'jest.config.js',
    ]);
  });

  it('VALID: {folder: "npm"} => package.json carries the per-subpath exports, sideEffects false and no typesVersions', () => {
    const files = gatewayPackageScaffoldFilesTransformer({
      scope: '@acme',
      folder: 'npm',
    });
    const packageJson = JSON.parse(
      String(fileNamed({ files, relativePath: 'package.json' })?.contents),
    );

    expect(packageJson).toStrictEqual({
      name: '@acme/npm',
      version: '0.1.0',
      description:
        'Gateway package: one subpath per third-party npm package our code imports, named for it',
      sideEffects: false,
      imports: {
        '#gateway/npm/*': '@acme/npm/*',
        '#gateway/node/*': '@acme/node/*',
        '#gateway/browser/*': '@acme/browser/*',
        '#gateway/bin/*': '@acme/bin/*',
      },
      exports: {
        './package.json': './package.json',
        './*.proxy': {
          'npm-own-source': './src/*.proxy.ts',
          'gateway-dist': './dist/*.proxy.d.ts',
          source: './src/*.proxy.ts',
          types: './dist/*.proxy.d.ts',
          import: './dist/*.proxy.js',
          require: './dist/*.proxy.js',
        },
        './*.stub': {
          'npm-own-source': './src/*.stub.ts',
          'gateway-dist': './dist/*.stub.d.ts',
          source: './src/*.stub.ts',
          types: './dist/*.stub.d.ts',
          import: './dist/*.stub.js',
          require: './dist/*.stub.js',
        },
        './*': {
          'npm-own-source': './src/*/*.ts',
          'gateway-dist': './dist/*/*.d.ts',
          source: './src/*/*.ts',
          types: './dist/*/*.d.ts',
          import: './dist/*/*.js',
          require: './dist/*/*.js',
        },
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
        'jest-environment-jsdom': '^30.0.0',
      },
      publishConfig: { access: 'public' },
    });
  });

  it('VALID: {folder: "browser"} => package.json adds the jsdom test dependencies', () => {
    const files = gatewayPackageScaffoldFilesTransformer({
      scope: '@acme',
      folder: 'browser',
    });
    const packageJson = JSON.parse(
      String(fileNamed({ files, relativePath: 'package.json' })?.contents),
    );

    expect(packageJson).toStrictEqual({
      name: '@acme/browser',
      version: '0.1.0',
      description: 'Gateway package: everything the browser provides — globals and browser APIs',
      sideEffects: false,
      imports: {
        '#gateway/npm/*': '@acme/npm/*',
        '#gateway/node/*': '@acme/node/*',
        '#gateway/browser/*': '@acme/browser/*',
        '#gateway/bin/*': '@acme/bin/*',
      },
      exports: {
        './package.json': './package.json',
        './*.proxy': {
          'browser-own-source': './src/*.proxy.ts',
          'gateway-dist': './dist/*.proxy.d.ts',
          source: './src/*.proxy.ts',
          types: './dist/*.proxy.d.ts',
          import: './dist/*.proxy.js',
          require: './dist/*.proxy.js',
        },
        './*.stub': {
          'browser-own-source': './src/*.stub.ts',
          'gateway-dist': './dist/*.stub.d.ts',
          source: './src/*.stub.ts',
          types: './dist/*.stub.d.ts',
          import: './dist/*.stub.js',
          require: './dist/*.stub.js',
        },
        './*': {
          'browser-own-source': './src/*/*.ts',
          'gateway-dist': './dist/*/*.d.ts',
          source: './src/*/*.ts',
          types: './dist/*/*.d.ts',
          import: './dist/*/*.js',
          require: './dist/*/*.js',
        },
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
      dependencies: {
        '@acme/node': '*',
      },
      devDependencies: {
        '@types/node': '^24.0.15',
        typescript: '^5.8.3',
        'jest-environment-jsdom': '^30.0.0',
      },
      publishConfig: { access: 'public' },
    });
  });

  it('VALID: {folder: "npm"} => tsconfig.json extends the repo root three levels up and excludes dist', () => {
    const files = gatewayPackageScaffoldFilesTransformer({
      scope: '@acme',
      folder: 'npm',
    });
    const tsconfig = JSON.parse(
      String(fileNamed({ files, relativePath: 'tsconfig.json' })?.contents),
    );

    expect(tsconfig).toStrictEqual({
      compilerOptions: {
        typeRoots: ['../../../node_modules/@types', '../../../@types', './@types'],
      },
      include: ['**/*.ts', '@types/**/*'],
      exclude: ['node_modules', 'dist'],
      extends: '../../../tsconfig.json',
    });
  });

  it('VALID: {folder: "npm"} => tsconfig.build.json reads other gateways through gateway-dist and ships proxies and stubs', () => {
    const files = gatewayPackageScaffoldFilesTransformer({
      scope: '@acme',
      folder: 'npm',
    });
    const tsconfigBuild = JSON.parse(
      String(fileNamed({ files, relativePath: 'tsconfig.build.json' })?.contents),
    );

    expect(tsconfigBuild).toStrictEqual({
      extends: './tsconfig.json',
      compilerOptions: {
        noEmit: false,
        rootDir: './src',
        outDir: './dist',
        declarationMap: true,
        declaration: true,
        incremental: true,
        tsBuildInfoFile: './.ward/build.tsbuildinfo',
        customConditions: ['npm-own-source', 'gateway-dist', 'source'],
      },
      exclude: ['**/*.test.ts', '**/*.test.tsx', '**/*.harness.ts', '@types/**/*', 'dist'],
    });
  });

  it('VALID: {folder: "node"} => jest.config.js spreads the published @dungeonmaster/testing base', () => {
    const files = gatewayPackageScaffoldFilesTransformer({
      scope: '@acme',
      folder: 'node',
    });

    expect(String(fileNamed({ files, relativePath: 'jest.config.js' })?.contents)).toBe(
      `const base = require('@dungeonmaster/testing/jest-config-base');

module.exports = {
  ...base,
};
`,
    );
  });

  it('VALID: {folder: "npm"} => jest.config.js resolves node, require and default, never browser or source, and adds the jsdom polyfill to the base setupFiles', () => {
    const files = gatewayPackageScaffoldFilesTransformer({
      scope: '@acme',
      folder: 'npm',
    });

    expect(String(fileNamed({ files, relativePath: 'jest.config.js' })?.contents)).toBe(
      `// A copied wrapper's test can switch itself to jsdom with an \`@jest-environment jsdom\` docblock
// (react-dom__client's root stub test does); the polyfill supplies the globals jsdom lacks. A
// node-environment test already has them, and the polyfill's own guards make it a no-op there.
const base = require('@dungeonmaster/testing/jest-config-base');

module.exports = {
  ...base,
  // jsdom resolves packages with the \`browser\` condition unless told otherwise. The base loads MSW's
  // Node server in \`setupFilesAfterEnv\`, and under \`browser\` it pulls @mswjs/interceptors' ES-module
  // browser build, which Jest cannot load. \`source\` stays out: it would point
  // @dungeonmaster/testing's own entry at its \`src/\` while the base's setup file loads \`dist/\`, so
  // a test would stage responses on a second MSW server that never answers.
  testEnvironmentOptions: { customExportConditions: ['node', 'require', 'default'] },
  setupFiles: [...(base.setupFiles ?? []), '@dungeonmaster/testing/jsdom-polyfills'],
};
`,
    );
  });

  it('VALID: {folder: "browser"} => jest.config.js runs under jsdom with the testing package\'s polyfill, resolving node, require and default, never browser or source', () => {
    const files = gatewayPackageScaffoldFilesTransformer({
      scope: '@acme',
      folder: 'browser',
    });

    expect(String(fileNamed({ files, relativePath: 'jest.config.js' })?.contents)).toBe(
      `// A jsdom environment: this package wraps browser globals (fetch, localStorage, WebSocket,
// indexedDB, document, ...), none of which exist under the base config's Node environment.
const base = require('@dungeonmaster/testing/jest-config-base');

module.exports = {
  ...base,
  testEnvironment: 'jsdom',
  testEnvironmentOptions: {
    // jsdom resolves packages with the \`browser\` condition unless told otherwise. The base loads
    // MSW's Node server in \`setupFilesAfterEnv\`, and under \`browser\` it pulls @mswjs/interceptors'
    // ES-module browser build, which Jest cannot load. \`source\` stays out: it would point
    // @dungeonmaster/testing's own entry at its \`src/\` while the base's setup file loads \`dist/\`,
    // so a test would stage responses on a second MSW server that never answers.
    customExportConditions: ['node', 'require', 'default'],
    url: 'http://localhost',
  },
  setupFiles: ['@dungeonmaster/testing/jsdom-polyfills'],
};
`,
    );
  });

  it('VALID: {folder: "bin"} => the placeholder is an empty module declaration', () => {
    const files = gatewayPackageScaffoldFilesTransformer({
      scope: '@acme',
      folder: 'bin',
    });

    expect(String(fileNamed({ files, relativePath: 'src/index.d.ts' })?.contents)).toBe(
      `// Keeps this package compiling while it holds no subpath: tsc refuses a config that matches no
// file. Delete it once the first src/<subpath>/<subpath>.ts exists.
export {};
`,
    );
  });
});
