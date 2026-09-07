import { packageScaffoldFilesTransformer } from './package-scaffold-files-transformer';
import { CreatePackageRequestStub } from '../../contracts/create-package-request/create-package-request.stub';
import { packageBuildOrderStatics } from '@dungeonmaster/shared/statics';

// No explicit tuple-array annotation: writing the word "string" here trips
// `@dungeonmaster/ban-primitives` (it only exempts a function's own parameter/return position).
// Each row's `as const` is what keeps its packageType literal and its path list intact instead.
const RELATIVE_PATHS_BY_TYPE = [
  [
    'library',
    [
      'package.json',
      'tsconfig.json',
      'tsconfig.build.json',
      'jest.config.js',
      'statics.ts',
      'src/statics/sample-pkg/sample-pkg-statics.ts',
      'src/statics/sample-pkg/sample-pkg-statics.test.ts',
    ],
  ] as const,
  [
    'programmatic-service',
    [
      'package.json',
      'tsconfig.json',
      'tsconfig.build.json',
      'jest.config.js',
      'flows.ts',
      'src/state/sample-pkg/sample-pkg-state.ts',
      'src/state/sample-pkg/sample-pkg-state.proxy.ts',
      'src/state/sample-pkg/sample-pkg-state.test.ts',
      'src/responders/sample-pkg/run/sample-pkg-run-responder.ts',
      'src/responders/sample-pkg/run/sample-pkg-run-responder.proxy.ts',
      'src/responders/sample-pkg/run/sample-pkg-run-responder.test.ts',
      'src/flows/sample-pkg/sample-pkg-flow.ts',
      'src/flows/sample-pkg/sample-pkg-flow.integration.test.ts',
      'src/startup/start-sample-pkg.ts',
      'src/startup/start-sample-pkg.integration.test.ts',
    ],
  ] as const,
  [
    'mcp-server',
    [
      'package.json',
      'tsconfig.json',
      'tsconfig.build.json',
      'jest.config.js',
      'flows.ts',
      'src/contracts/tool-registration/tool-registration-contract.ts',
      'src/contracts/tool-registration/tool-registration.stub.ts',
      'src/contracts/tool-registration/tool-registration-contract.test.ts',
      'src/flows/sample-pkg/sample-pkg-flow.ts',
      'src/flows/sample-pkg/sample-pkg-flow.integration.test.ts',
    ],
  ] as const,
  [
    'http-backend',
    [
      'package.json',
      'tsconfig.json',
      'tsconfig.build.json',
      'jest.config.js',
      'adapters.ts',
      'src/adapters/hono/app-create/hono-app-create-adapter.ts',
      'src/adapters/hono/app-create/hono-app-create-adapter.proxy.ts',
      'src/adapters/hono/app-create/hono-app-create-adapter.test.ts',
    ],
  ] as const,
  [
    'frontend-react',
    [
      'package.json',
      'tsconfig.json',
      'tsconfig.build.json',
      'jest.config.js',
      'playwright.config.ts',
      'widgets.ts',
      'src/widgets/sample-pkg-panel/sample-pkg-panel-widget.tsx',
      'src/widgets/sample-pkg-panel/sample-pkg-panel-widget.proxy.tsx',
      'src/widgets/sample-pkg-panel/sample-pkg-panel-widget.test.tsx',
    ],
  ] as const,
  [
    'frontend-ink',
    [
      'package.json',
      'tsconfig.json',
      'tsconfig.build.json',
      'jest.config.js',
      'playwright.config.ts',
      'widgets.ts',
      'src/adapters/ink/render/ink-render-adapter.ts',
      'src/adapters/ink/render/ink-render-adapter.proxy.ts',
      'src/adapters/ink/render/ink-render-adapter.test.ts',
      'src/adapters/ink/text/ink-text-adapter.ts',
      'src/adapters/ink/text/ink-text-adapter.proxy.ts',
      'src/adapters/ink/text/ink-text-adapter.test.ts',
      'src/widgets/sample-pkg-panel/sample-pkg-panel-widget.tsx',
      'src/widgets/sample-pkg-panel/sample-pkg-panel-widget.proxy.tsx',
      'src/widgets/sample-pkg-panel/sample-pkg-panel-widget.test.tsx',
    ],
  ] as const,
  [
    'cli-tool',
    [
      'package.json',
      'tsconfig.json',
      'tsconfig.build.json',
      'jest.config.js',
      'bin/sample-pkg-entry.ts',
      'src/startup/start-sample-pkg.ts',
      'src/startup/start-sample-pkg.integration.test.ts',
    ],
  ] as const,
  [
    'hook-handlers',
    [
      'package.json',
      'tsconfig.json',
      'tsconfig.build.json',
      'jest.config.js',
      'src/responders/hook/pre-tool-use/hook-pre-tool-use-responder.ts',
      'src/responders/hook/pre-tool-use/hook-pre-tool-use-responder.proxy.ts',
      'src/responders/hook/pre-tool-use/hook-pre-tool-use-responder.test.ts',
      'bin/sample-pkg-pre-tool-use.ts',
      'bin/sample-pkg-session-start.ts',
    ],
  ] as const,
  [
    'eslint-plugin',
    [
      'package.json',
      'tsconfig.json',
      'tsconfig.build.json',
      'jest.config.js',
      'src/brokers/rule/sample-pkg/rule-sample-pkg-broker.ts',
      'src/brokers/rule/sample-pkg/rule-sample-pkg-broker.proxy.ts',
      'src/brokers/rule/sample-pkg/rule-sample-pkg-broker.test.ts',
      'src/responders/config/create/config-create-responder.ts',
      'src/responders/config/create/config-create-responder.proxy.ts',
      'src/responders/config/create/config-create-responder.test.ts',
      'src/index.ts',
      'src/index.test.ts',
    ],
  ] as const,
];

describe('packageScaffoldFilesTransformer', () => {
  describe('relativePath coverage', () => {
    it('VALID: {} => covers exactly the types packageBuildOrderStatics declares', () => {
      const declaredTypes = [...packageBuildOrderStatics.tiers.flat()].sort();

      expect(RELATIVE_PATHS_BY_TYPE.map(([packageType]) => packageType).sort()).toStrictEqual(
        declaredTypes,
      );
    });

    it.each(RELATIVE_PATHS_BY_TYPE)(
      'VALID: {packageType: %s} => produces exactly its expected relativePath set',
      (packageType, expectedPaths) => {
        const request = CreatePackageRequestStub({
          packageType,
          directoryName: 'sample-pkg',
          packageName: '@acme/sample-pkg',
          description: 'Sample package',
        });

        const files = packageScaffoldFilesTransformer({ request });

        expect(files.map((file) => file.relativePath).sort()).toStrictEqual(
          [...expectedPaths].sort(),
        );
      },
    );
  });

  describe('library package.json / tsconfig.json / tsconfig.build.json', () => {
    it('VALID: {packageType: "library"} => package.json body is exact', () => {
      const files = packageScaffoldFilesTransformer({ request: CreatePackageRequestStub() });
      const packageJsonFile = files.find((file) => file.relativePath === 'package.json');

      expect(packageJsonFile!.contents).toBe(`{
  "name": "@acme/widgets",
  "version": "0.1.0",
  "description": "Widgets package",
  "exports": {
    "./statics": {
      "source": "./statics.ts",
      "import": "./dist/statics.js",
      "require": "./dist/statics.js",
      "types": "./dist/statics.d.ts"
    }
  },
  "files": [
    "dist/**/*"
  ],
  "scripts": {
    "build": "tsc -p tsconfig.build.json",
    "build:clean": "rm -rf dist .ward/build.tsbuildinfo && npm run build",
    "test": "dungeonmaster-ward --only test",
    "typecheck": "dungeonmaster-ward --only typecheck",
    "lint": "dungeonmaster-ward --only lint",
    "ward": "dungeonmaster-ward"
  },
  "devDependencies": {
    "@types/node": "^20.11.0",
    "typescript": "^5.3.3"
  },
  "publishConfig": {
    "access": "public"
  }
}
`);
    });

    it('VALID: {packageType: "library"} => tsconfig.json body is exact', () => {
      const files = packageScaffoldFilesTransformer({ request: CreatePackageRequestStub() });
      const tsconfigFile = files.find((file) => file.relativePath === 'tsconfig.json');

      expect(tsconfigFile!.contents).toBe(`{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "typeRoots": [
      "../../node_modules/@types",
      "../../@types"
    ]
  },
  "include": [
    "src/**/*",
    "test/**/*",
    "*.ts"
  ]
}
`);
    });

    it('VALID: {packageType: "library"} => tsconfig.build.json body is exact', () => {
      const files = packageScaffoldFilesTransformer({ request: CreatePackageRequestStub() });
      const tsconfigBuildFile = files.find((file) => file.relativePath === 'tsconfig.build.json');

      expect(tsconfigBuildFile!.contents).toBe(`{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "noEmit": false,
    "rootDir": "./",
    "outDir": "./dist",
    "declaration": true,
    "declarationMap": true,
    "incremental": true,
    "tsBuildInfoFile": "./.ward/build.tsbuildinfo"
  },
  "exclude": [
    "**/*.test.ts",
    "**/*.test.tsx",
    "**/*.proxy.ts",
    "**/*.stub.ts",
    "**/*.harness.ts",
    "test/**",
    "src/.test-tmp/**",
    "src/_lint-testbed/**"
  ]
}
`);
    });
  });

  describe('package.json field presence', () => {
    it('VALID: {packageType: "library"} => bin and dependencies are absent, exports carries the statics barrel', () => {
      const files = packageScaffoldFilesTransformer({ request: CreatePackageRequestStub() });
      const packageJsonFile = files.find((file) => file.relativePath === 'package.json');
      const parsed = JSON.parse(packageJsonFile!.contents);

      expect(parsed).toStrictEqual({
        name: '@acme/widgets',
        version: '0.1.0',
        description: 'Widgets package',
        exports: {
          './statics': {
            source: './statics.ts',
            import: './dist/statics.js',
            require: './dist/statics.js',
            types: './dist/statics.d.ts',
          },
        },
        files: ['dist/**/*'],
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
        publishConfig: { access: 'public' },
      });
    });

    it('VALID: {packageType: "hook-handlers"} => bin and dependencies are present, exports is entirely absent', () => {
      const files = packageScaffoldFilesTransformer({
        request: CreatePackageRequestStub({ packageType: 'hook-handlers' }),
      });
      const packageJsonFile = files.find((file) => file.relativePath === 'package.json');
      const parsed = JSON.parse(packageJsonFile!.contents);

      expect(parsed).toStrictEqual({
        name: '@acme/widgets',
        version: '0.1.0',
        description: 'Widgets package',
        files: ['dist/**/*'],
        bin: {
          'widgets-pre-tool-use': './dist/bin/widgets-pre-tool-use.js',
          'widgets-session-start': './dist/bin/widgets-session-start.js',
        },
        scripts: {
          build: 'tsc -p tsconfig.build.json',
          'build:clean': 'rm -rf dist .ward/build.tsbuildinfo && npm run build',
          test: 'dungeonmaster-ward --only test',
          typecheck: 'dungeonmaster-ward --only typecheck',
          lint: 'dungeonmaster-ward --only lint',
          ward: 'dungeonmaster-ward',
          postbuild: 'chmod +x dist/bin/*.js 2>/dev/null || true',
        },
        dependencies: { '@acme/shared': '*' },
        devDependencies: {
          '@types/node': '^20.11.0',
          typescript: '^5.3.3',
        },
        publishConfig: { access: 'public' },
      });
    });

    it('VALID: {packageType: "cli-tool"} => postbuild is present and exports carries only a "." subpath under dist/src', () => {
      const files = packageScaffoldFilesTransformer({
        request: CreatePackageRequestStub({ packageType: 'cli-tool' }),
      });
      const packageJsonFile = files.find((file) => file.relativePath === 'package.json');
      const parsed = JSON.parse(packageJsonFile!.contents);

      expect(parsed).toStrictEqual({
        name: '@acme/widgets',
        version: '0.1.0',
        description: 'Widgets package',
        exports: {
          '.': {
            source: './src/startup/start-widgets.ts',
            import: './dist/src/startup/start-widgets.js',
            require: './dist/src/startup/start-widgets.js',
            types: './dist/src/startup/start-widgets.d.ts',
          },
        },
        files: ['dist/**/*'],
        bin: {
          widgets: './dist/bin/widgets-entry.js',
        },
        scripts: {
          build: 'tsc -p tsconfig.build.json',
          'build:clean': 'rm -rf dist .ward/build.tsbuildinfo && npm run build',
          test: 'dungeonmaster-ward --only test',
          typecheck: 'dungeonmaster-ward --only typecheck',
          lint: 'dungeonmaster-ward --only lint',
          ward: 'dungeonmaster-ward',
          postbuild: 'chmod +x dist/bin/*.js 2>/dev/null || true',
        },
        devDependencies: {
          '@types/node': '^20.11.0',
          typescript: '^5.3.3',
        },
        publishConfig: { access: 'public' },
      });
    });

    it('VALID: {packageType: "eslint-plugin"} => no postbuild and exports carries only a "." subpath stripped of src/', () => {
      const files = packageScaffoldFilesTransformer({
        request: CreatePackageRequestStub({ packageType: 'eslint-plugin' }),
      });
      const packageJsonFile = files.find((file) => file.relativePath === 'package.json');
      const parsed = JSON.parse(packageJsonFile!.contents);

      expect(parsed).toStrictEqual({
        name: '@acme/widgets',
        version: '0.1.0',
        description: 'Widgets package',
        exports: {
          '.': {
            source: './src/index.ts',
            import: './dist/index.js',
            require: './dist/index.js',
            types: './dist/index.d.ts',
          },
        },
        files: ['dist/**/*'],
        scripts: {
          build: 'tsc -p tsconfig.build.json',
          'build:clean': 'rm -rf dist .ward/build.tsbuildinfo && npm run build',
          test: 'dungeonmaster-ward --only test',
          typecheck: 'dungeonmaster-ward --only typecheck',
          lint: 'dungeonmaster-ward --only lint',
          ward: 'dungeonmaster-ward',
        },
        dependencies: { '@acme/shared': '*' },
        devDependencies: {
          '@types/node': '^20.11.0',
          typescript: '^5.3.3',
        },
        publishConfig: { access: 'public' },
      });
    });

    it('VALID: {packageType: "http-backend"} => dependencies carries the seed hono pin', () => {
      const files = packageScaffoldFilesTransformer({
        request: CreatePackageRequestStub({ packageType: 'http-backend' }),
      });
      const packageJsonFile = files.find((file) => file.relativePath === 'package.json');
      const parsed = JSON.parse(packageJsonFile!.contents);

      expect(parsed).toStrictEqual({
        name: '@acme/widgets',
        version: '0.1.0',
        description: 'Widgets package',
        exports: {
          './adapters': {
            source: './adapters.ts',
            import: './dist/adapters.js',
            require: './dist/adapters.js',
            types: './dist/adapters.d.ts',
          },
        },
        files: ['dist/**/*'],
        scripts: {
          build: 'tsc -p tsconfig.build.json',
          'build:clean': 'rm -rf dist .ward/build.tsbuildinfo && npm run build',
          test: 'dungeonmaster-ward --only test',
          typecheck: 'dungeonmaster-ward --only typecheck',
          lint: 'dungeonmaster-ward --only lint',
          ward: 'dungeonmaster-ward',
        },
        dependencies: { hono: '^4.0.0' },
        devDependencies: {
          '@types/node': '^20.11.0',
          typescript: '^5.3.3',
        },
        publishConfig: { access: 'public' },
      });
    });
  });

  describe('jest.config.js substitution', () => {
    it('VALID: {packageType: "library"} => roots includes only src', () => {
      const files = packageScaffoldFilesTransformer({ request: CreatePackageRequestStub() });
      const jestConfigFile = files.find((file) => file.relativePath === 'jest.config.js');

      expect(jestConfigFile!.contents).toMatch(/^ {2}roots: \['<rootDir>\/src'\],$/mu);
    });

    it('VALID: {packageType: "hook-handlers"} => roots includes both src and bin', () => {
      const files = packageScaffoldFilesTransformer({
        request: CreatePackageRequestStub({ packageType: 'hook-handlers' }),
      });
      const jestConfigFile = files.find((file) => file.relativePath === 'jest.config.js');

      expect(jestConfigFile!.contents).toMatch(
        /^ {2}roots: \['<rootDir>\/src', '<rootDir>\/bin'\],$/mu,
      );
    });

    it('VALID: {packageType: "frontend-react"} => testEnvironment is jsdom', () => {
      const files = packageScaffoldFilesTransformer({
        request: CreatePackageRequestStub({ packageType: 'frontend-react' }),
      });
      const jestConfigFile = files.find((file) => file.relativePath === 'jest.config.js');

      expect(jestConfigFile!.contents).toMatch(/^ {2}testEnvironment: 'jsdom',$/mu);
    });

    it('VALID: {packageType: "frontend-ink"} => testEnvironment is node', () => {
      const files = packageScaffoldFilesTransformer({
        request: CreatePackageRequestStub({ packageType: 'frontend-ink' }),
      });
      const jestConfigFile = files.find((file) => file.relativePath === 'jest.config.js');

      expect(jestConfigFile!.contents).toMatch(/^ {2}testEnvironment: 'node',$/mu);
    });
  });

  describe('placeholder substitution', () => {
    it('VALID: {directoryName: "foo-bar"} => the state file substitutes __TESTID__', () => {
      const files = packageScaffoldFilesTransformer({
        request: CreatePackageRequestStub({
          packageType: 'programmatic-service',
          directoryName: 'foo-bar',
          packageName: '@acme/foo-bar',
          description: 'Foo bar package',
        }),
      });
      const stateFile = files.find(
        (file) => file.relativePath === 'src/state/foo-bar/foo-bar-state.ts',
      );

      expect(stateFile!.contents).toMatch(
        /^const FOO_BAR_STORE = new Map<PathSegment, ContentText>\(\);$/mu,
      );
    });

    it('VALID: {directoryName: "foo-bar"} => the state file substitutes __CAMEL__', () => {
      const files = packageScaffoldFilesTransformer({
        request: CreatePackageRequestStub({
          packageType: 'programmatic-service',
          directoryName: 'foo-bar',
          packageName: '@acme/foo-bar',
          description: 'Foo bar package',
        }),
      });
      const stateFile = files.find(
        (file) => file.relativePath === 'src/state/foo-bar/foo-bar-state.ts',
      );

      expect(stateFile!.contents).toMatch(/^export const fooBarState = \{$/mu);
    });

    it('VALID: {directoryName: "foo-bar"} => the run responder file substitutes __PASCAL__', () => {
      const files = packageScaffoldFilesTransformer({
        request: CreatePackageRequestStub({
          packageType: 'programmatic-service',
          directoryName: 'foo-bar',
          packageName: '@acme/foo-bar',
          description: 'Foo bar package',
        }),
      });
      const responderFile = files.find(
        (file) => file.relativePath === 'src/responders/foo-bar/run/foo-bar-run-responder.ts',
      );

      expect(responderFile!.contents).toMatch(/^export const FooBarRunResponder = \(\{$/mu);
    });

    it('VALID: {} => no returned file across all nine types retains an unsubstituted placeholder', () => {
      const offendingPaths = packageBuildOrderStatics.tiers
        .flat()
        .flatMap((packageType) =>
          packageScaffoldFilesTransformer({
            request: CreatePackageRequestStub({
              packageType,
              directoryName: 'foo-bar',
              packageName: '@acme/foo-bar',
              description: 'Foo bar package',
            }),
          }).filter((file) => /__[A-Z]+__/u.test(file.contents)),
        )
        .map((file) => file.relativePath);

      expect(offendingPaths).toStrictEqual([]);
    });
  });
});
