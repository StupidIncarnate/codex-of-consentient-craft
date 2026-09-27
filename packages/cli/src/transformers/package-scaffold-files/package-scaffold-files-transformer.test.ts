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
      'src/statics/e2e-unresolvable-token/e2e-unresolvable-token-statics.ts',
      'src/statics/e2e-unresolvable-token/e2e-unresolvable-token-statics.test.ts',
      'widgets.ts',
      'src/widgets/sample-pkg-panel/sample-pkg-panel-widget.tsx',
      'src/widgets/sample-pkg-panel/sample-pkg-panel-widget.proxy.tsx',
      'src/widgets/sample-pkg-panel/sample-pkg-panel-widget.test.tsx',
      '__mocks__/jsdom-polyfills.cjs',
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
      'src/statics/e2e-unresolvable-token/e2e-unresolvable-token-statics.ts',
      'src/statics/e2e-unresolvable-token/e2e-unresolvable-token-statics.test.ts',
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
  "imports": {
    "#gateway/npm/*": "@acme/npm/*",
    "#gateway/node/*": "@acme/node/*",
    "#gateway/browser/*": "@acme/browser/*",
    "#gateway/bin/*": "@acme/bin/*"
  },
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
    "tsBuildInfoFile": "./.ward/build.tsbuildinfo",
    "customConditions": [
      "gateway-dist",
      "source"
    ]
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
        imports: {
          '#gateway/npm/*': '@acme/npm/*',
          '#gateway/node/*': '@acme/node/*',
          '#gateway/browser/*': '@acme/browser/*',
          '#gateway/bin/*': '@acme/bin/*',
        },
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
        imports: {
          '#gateway/npm/*': '@acme/npm/*',
          '#gateway/node/*': '@acme/node/*',
          '#gateway/browser/*': '@acme/browser/*',
          '#gateway/bin/*': '@acme/bin/*',
        },
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
        imports: {
          '#gateway/npm/*': '@acme/npm/*',
          '#gateway/node/*': '@acme/node/*',
          '#gateway/browser/*': '@acme/browser/*',
          '#gateway/bin/*': '@acme/bin/*',
        },
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
        imports: {
          '#gateway/npm/*': '@acme/npm/*',
          '#gateway/node/*': '@acme/node/*',
          '#gateway/browser/*': '@acme/browser/*',
          '#gateway/bin/*': '@acme/bin/*',
        },
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
        imports: {
          '#gateway/npm/*': '@acme/npm/*',
          '#gateway/node/*': '@acme/node/*',
          '#gateway/browser/*': '@acme/browser/*',
          '#gateway/bin/*': '@acme/bin/*',
        },
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

    it('VALID: {packageType: "frontend-react"} => dependencies carry @types/react and @types/react-dom, so the seed typechecks and builds', () => {
      const files = packageScaffoldFilesTransformer({
        request: CreatePackageRequestStub({ packageType: 'frontend-react' }),
      });
      const packageJsonFile = files.find((file) => file.relativePath === 'package.json');

      expect(packageJsonFile!.contents).toMatch(
        /^ {2}"dependencies": \{$\n^ {4}"react": "\^19\.0\.0",$\n^ {4}"react-dom": "\^19\.0\.0",$\n^ {4}"@types\/react": "\^19\.0\.0",$\n^ {4}"@types\/react-dom": "\^19\.2\.3"$\n^ {2}\},$/mu,
      );
    });

    it('VALID: {packageType: "frontend-react"} => devDependencies merge the seed\'s jest-environment-jsdom/undici pair onto the base pair', () => {
      const files = packageScaffoldFilesTransformer({
        request: CreatePackageRequestStub({ packageType: 'frontend-react' }),
      });
      const packageJsonFile = files.find((file) => file.relativePath === 'package.json');

      expect(packageJsonFile!.contents).toMatch(
        /^ {2}"devDependencies": \{$\n^ {4}"@types\/node": "\^20\.11\.0",$\n^ {4}"typescript": "\^5\.3\.3",$\n^ {4}"jest-environment-jsdom": "\^30\.0\.0",$\n^ {4}"undici": "\^7\.21\.0"$\n^ {2}\},$/mu,
      );
    });

    it.each(packageBuildOrderStatics.tiers.flat())(
      'VALID: {packageType: %s} => package.json imports maps all four #gateway folders to the request scope',
      (packageType) => {
        const files = packageScaffoldFilesTransformer({
          request: CreatePackageRequestStub({ packageType }),
        });
        const packageJsonFile = files.find((file) => file.relativePath === 'package.json');

        expect(packageJsonFile!.contents).toMatch(
          /^ {2}"imports": \{$\n^ {4}"#gateway\/npm\/\*": "@acme\/npm\/\*",$\n^ {4}"#gateway\/node\/\*": "@acme\/node\/\*",$\n^ {4}"#gateway\/browser\/\*": "@acme\/browser\/\*",$\n^ {4}"#gateway\/bin\/\*": "@acme\/bin\/\*"$\n^ {2}\},$/mu,
        );
      },
    );

    it('VALID: {packageName: "@other-scope/widgets"} => package.json imports substitutes that scope, not a hardcoded one', () => {
      const files = packageScaffoldFilesTransformer({
        request: CreatePackageRequestStub({
          packageName: '@other-scope/widgets',
          directoryName: 'widgets',
          description: 'Widgets package',
        }),
      });
      const packageJsonFile = files.find((file) => file.relativePath === 'package.json');

      expect(packageJsonFile!.contents).toMatch(
        /^ {2}"imports": \{$\n^ {4}"#gateway\/npm\/\*": "@other-scope\/npm\/\*",$\n^ {4}"#gateway\/node\/\*": "@other-scope\/node\/\*",$\n^ {4}"#gateway\/browser\/\*": "@other-scope\/browser\/\*",$\n^ {4}"#gateway\/bin\/\*": "@other-scope\/bin\/\*"$\n^ {2}\},$/mu,
      );
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

    // These three types ship a flows/ or startup/ file plus its .integration.test.ts companion,
    // the only seeded files that ever import `@dungeonmaster/testing`'s root barrel
    // (`installTestbedCreateBroker`) — which pulls in msw's ESM. Without both the widened
    // `transform` and the `transformIgnorePatterns` un-ignore, that import throws
    // "SyntaxError: Unexpected token 'export'" from `until-async`/`msw` (verified directly against
    // a real jest run: dropping either half alone still throws).
    const NEEDS_MSW_TRANSFORM_TYPES = ['programmatic-service', 'mcp-server', 'cli-tool'] as const;

    it.each(NEEDS_MSW_TRANSFORM_TYPES)(
      'VALID: {packageType: %s} => jest config un-ignores msw/until-async so it is eligible for transform',
      (packageType) => {
        const files = packageScaffoldFilesTransformer({
          request: CreatePackageRequestStub({ packageType }),
        });
        const jestConfigFile = files.find((file) => file.relativePath === 'jest.config.js');

        expect(jestConfigFile!.contents).toMatch(
          /^ {2}transformIgnorePatterns: \['\/dist\/', '\/node_modules\/\(\?!\(msw\|@mswjs\|until-async\|outvariant\)\/\)'\],$/mu,
        );
      },
    );

    it.each(NEEDS_MSW_TRANSFORM_TYPES)(
      'VALID: {packageType: %s} => jest config requires the shared ts-jest options entry, which only rides along with an explicit transform block',
      (packageType) => {
        const files = packageScaffoldFilesTransformer({
          request: CreatePackageRequestStub({ packageType }),
        });
        const jestConfigFile = files.find((file) => file.relativePath === 'jest.config.js');

        expect(jestConfigFile!.contents).toMatch(
          /^const dungeonmasterTsJestOptions = require\('\.\.\/\.\.\/packages\/testing\/ts-jest\/options\.js'\);$/mu,
        );
      },
    );

    it('VALID: {packageType: "library"} => jest config body is exactly the bare node template, carrying no msw transform pair and no setupFilesAfterEnv override', () => {
      const files = packageScaffoldFilesTransformer({ request: CreatePackageRequestStub() });
      const jestConfigFile = files.find((file) => file.relativePath === 'jest.config.js');

      expect(jestConfigFile!.contents)
        .toBe(`const baseConfig = require('../../jest.config.base.js');

module.exports = {
  ...baseConfig,
  roots: ['<rootDir>/src'],
};
`);
    });

    // F6: a consumer repo has no repo-root `jest.config.base.js` (only this checkout does), so its
    // scaffolded packages must require the PUBLISHED `@dungeonmaster/testing/jest-config-base`
    // instead — never the repo-relative path above, which is unresolvable outside this monorepo.
    describe('usesPublishedJestBase: true (a consumer repo)', () => {
      it('VALID: {packageType: "library"} => jest config requires the published testing base, not the repo-root file', () => {
        const files = packageScaffoldFilesTransformer({
          request: CreatePackageRequestStub(),
          usesPublishedJestBase: true,
        });
        const jestConfigFile = files.find((file) => file.relativePath === 'jest.config.js');

        expect(jestConfigFile!.contents)
          .toBe(`const base = require('@dungeonmaster/testing/jest-config-base');

module.exports = {
  ...base,
  roots: ['<rootDir>/src'],
};
`);
      });

      it('VALID: {packageType: "frontend-react"} => jest config requires the published testing base and widens its transform to tsx/jsx', () => {
        const files = packageScaffoldFilesTransformer({
          request: CreatePackageRequestStub({ packageType: 'frontend-react' }),
          usesPublishedJestBase: true,
        });
        const jestConfigFile = files.find((file) => file.relativePath === 'jest.config.js');

        expect(jestConfigFile!.contents)
          .toBe(`const base = require('@dungeonmaster/testing/jest-config-base');
const tsJestEntry = Object.values(base.transform)[0];

module.exports = {
  ...base,
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/src'],
  setupFiles: ['<rootDir>/__mocks__/jsdom-polyfills.cjs'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'mjs', 'json'],
  testMatch: ['**/src/**/*.test.[jt]s?(x)'],
  transform: {
    '^.+\\\\.[jt]sx?$': tsJestEntry,
    '/node_modules/.+\\\\.[cm]?js$': tsJestEntry,
  },
};
`);
      });

      it('VALID: {packageType: "frontend-ink"} => jest config carries an empty setupFiles, since testEnvironment stays node', () => {
        const files = packageScaffoldFilesTransformer({
          request: CreatePackageRequestStub({ packageType: 'frontend-ink' }),
          usesPublishedJestBase: true,
        });
        const jestConfigFile = files.find((file) => file.relativePath === 'jest.config.js');

        expect(jestConfigFile!.contents).toMatch(/^ {2}setupFiles: \[\],$/mu);
      });
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
