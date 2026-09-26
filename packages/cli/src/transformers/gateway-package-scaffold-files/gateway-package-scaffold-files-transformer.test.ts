import { PathSegmentStub } from '@dungeonmaster/shared/contracts';
import { gatewayPackageScaffoldFilesTransformer } from './gateway-package-scaffold-files-transformer';

const fileNamed = ({
  files,
  relativePath,
}: {
  files: readonly ReturnType<typeof gatewayPackageScaffoldFilesTransformer>[number][];
  relativePath: string;
}) => files.find((file) => String(file.relativePath) === relativePath);

describe('gatewayPackageScaffoldFilesTransformer', () => {
  it('VALID: {scope: "@acme", folder: "npm"} => builds five files, relative to the package root', () => {
    const files = gatewayPackageScaffoldFilesTransformer({
      scope: PathSegmentStub({ value: '@acme' }),
      folder: 'npm',
    });

    expect(files.map((file) => String(file.relativePath))).toStrictEqual([
      'package.json',
      'tsconfig.json',
      'tsconfig.build.json',
      'jest.config.js',
      'src/_test_/index.ts',
    ]);
  });

  it('VALID: {scope: "@acme", folder: "npm"} => package.json names it @acme/npm with the four-entry imports map and no dependencies', () => {
    const files = gatewayPackageScaffoldFilesTransformer({
      scope: PathSegmentStub({ value: '@acme' }),
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
      imports: {
        '#gateway/npm/*': '@acme/npm/*',
        '#gateway/node/*': '@acme/node/*',
        '#gateway/browser/*': '@acme/browser/*',
        '#gateway/bin/*': '@acme/bin/*',
      },
      exports: {
        './_test_': {
          source: './src/_test_/index.ts',
          import: './dist/_test_/index.js',
          require: './dist/_test_/index.js',
          types: './dist/_test_/index.d.ts',
        },
        './*': {
          source: './src/*/index.ts',
          import: './dist/*/index.js',
          require: './dist/*/index.js',
          types: './dist/*/index.d.ts',
        },
      },
      typesVersions: { '*': { '*': ['src/*/index.ts', 'src/*'] } },
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
    });
  });

  it('VALID: {scope: "@acme", folder: "bin"} => package.json description matches the bin folder\'s own', () => {
    const files = gatewayPackageScaffoldFilesTransformer({
      scope: PathSegmentStub({ value: '@acme' }),
      folder: 'bin',
    });
    const packageJson = JSON.parse(
      String(fileNamed({ files, relativePath: 'package.json' })?.contents),
    );

    expect(packageJson).toStrictEqual({
      name: '@acme/bin',
      version: '0.1.0',
      description: 'Gateway package: programs installed on the machine, run through spawn',
      imports: {
        '#gateway/npm/*': '@acme/npm/*',
        '#gateway/node/*': '@acme/node/*',
        '#gateway/browser/*': '@acme/browser/*',
        '#gateway/bin/*': '@acme/bin/*',
      },
      exports: {
        './_test_': {
          source: './src/_test_/index.ts',
          import: './dist/_test_/index.js',
          require: './dist/_test_/index.js',
          types: './dist/_test_/index.d.ts',
        },
        './*': {
          source: './src/*/index.ts',
          import: './dist/*/index.js',
          require: './dist/*/index.js',
          types: './dist/*/index.d.ts',
        },
      },
      typesVersions: { '*': { '*': ['src/*/index.ts', 'src/*'] } },
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
    });
  });

  it('VALID: {scope: "@acme", folder: "npm"} => tsconfig.json extends the repo root three levels up', () => {
    const files = gatewayPackageScaffoldFilesTransformer({
      scope: PathSegmentStub({ value: '@acme' }),
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
      extends: '../../../tsconfig.json',
    });
  });

  it('VALID: {scope: "@acme", folder: "npm"} => tsconfig.build.json points the other three folders at dist and itself at src', () => {
    const files = gatewayPackageScaffoldFilesTransformer({
      scope: PathSegmentStub({ value: '@acme' }),
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
        paths: {
          '#gateway/npm/*': ['./src/*/index.ts'],
          '#gateway/node/*': ['../node/dist/*/index.d.ts'],
          '#gateway/browser/*': ['../browser/dist/*/index.d.ts'],
          '#gateway/bin/*': ['../bin/dist/*/index.d.ts'],
        },
      },
      exclude: [
        '**/*.test.ts',
        '**/*.test.tsx',
        '**/*.proxy.ts',
        '**/*.stub.ts',
        '**/*.harness.ts',
        '@types/**/*',
        'dist',
      ],
    });
  });

  it('VALID: {scope: "@acme", folder: "bin"} => tsconfig.build.json points itself at src and every OTHER folder at dist', () => {
    const files = gatewayPackageScaffoldFilesTransformer({
      scope: PathSegmentStub({ value: '@acme' }),
      folder: 'bin',
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
        paths: {
          '#gateway/npm/*': ['../npm/dist/*/index.d.ts'],
          '#gateway/node/*': ['../node/dist/*/index.d.ts'],
          '#gateway/browser/*': ['../browser/dist/*/index.d.ts'],
          '#gateway/bin/*': ['./src/*/index.ts'],
        },
      },
      exclude: [
        '**/*.test.ts',
        '**/*.test.tsx',
        '**/*.proxy.ts',
        '**/*.stub.ts',
        '**/*.harness.ts',
        '@types/**/*',
        'dist',
      ],
    });
  });

  it('VALID: {scope: "@acme", folder: "npm"} => jest.config.js spreads the repo-root base three levels up', () => {
    const files = gatewayPackageScaffoldFilesTransformer({
      scope: PathSegmentStub({ value: '@acme' }),
      folder: 'npm',
    });

    expect(fileNamed({ files, relativePath: 'jest.config.js' })?.contents).toBe(
      `// Extend shared Jest configuration
const baseConfig = require('../../../jest.config.base.js');

module.exports = {
  ...baseConfig,
};
`,
    );
  });

  it('VALID: {scope: "@acme", folder: "npm"} => src/_test_/index.ts is an empty proxy barrel naming the package', () => {
    const files = gatewayPackageScaffoldFilesTransformer({
      scope: PathSegmentStub({ value: '@acme' }),
      folder: 'npm',
    });

    expect(fileNamed({ files, relativePath: 'src/_test_/index.ts' })?.contents).toBe(
      `/**
 * PURPOSE: Caller-facing proxy surface for @acme/npm's wrapped modules. Empty until
 * a wrapped (non-pass-through) module needs a proxy a caller can import.
 *
 * USAGE:
 * import { exampleProxy } from '@acme/npm/_test_';
 */
`,
    );
  });
});
