// The TypeScript loader for the `.ts` requires below. `tsx/cjs` and not `ts-node/register`:
// ts-node compiles in memory, per process, keeping nothing, so every process that loads this file
// re-transpiles the plugin source and the ~500 `shared` modules behind it. tsx transpiles with
// esbuild into a content-keyed disk cache, so the next process reads what the last one built.
// This file is loaded by every lint run AND by every spawned hook child in the hooks integration
// suite, which is where the cost was measured.
require('tsx/cjs');

const tsparser = require('@typescript-eslint/parser');
const prettierConfig = require('eslint-config-prettier');
const prettierPlugin = require('eslint-plugin-prettier');
const jestPlugin = require('eslint-plugin-jest');
const eslintCommentsPlugin = require('eslint-plugin-eslint-comments');
// Import our own dungeonmaster plugin and config directly from TypeScript source
const dungeonmasterPlugin = require('./packages/eslint-plugin/src/index.ts').default;
const {
  configDungeonmasterBroker,
} = require('./packages/eslint-plugin/src/brokers/config/dungeonmaster/config-dungeonmaster-broker.ts');
const {
  configGatewayLintConfigBroker,
} = require('./packages/eslint-plugin/src/brokers/config/gateway-lint-config/config-gateway-lint-config-broker.ts');
const {
  configWorkspacePackageNamesBroker,
} = require('./packages/eslint-plugin/src/brokers/config/workspace-package-names/config-workspace-package-names-broker.ts');
const { gatewayLocationsStatics } = require('@dungeonmaster/shared/statics');
const { filePathContract } = require('@dungeonmaster/shared/contracts');
// Import repo-private local-eslint plugin (never shipped) from TypeScript source
const dungeonmasterLocalPlugin = require('./packages/local-eslint/src/index.ts').default;

// Read `.dungeonmaster.json`'s `gateway` key ONCE, here, when this file loads — never inside a rule
// at lint time. configDungeonmasterBroker itself does no file I/O: @dungeonmaster/eslint-plugin's own
// index.ts calls it at MODULE IMPORT time, so any read inside it would run merely from requiring the
// package, breaking every other package that imports a plugin export.
const gatewayLintConfig = configGatewayLintConfigBroker({
  startDir: filePathContract.parse(__dirname),
});

// Read the workspaces root's own `workspaces` globs ONCE, here, when this file loads — never inside
// a rule at lint time. ban-workspace-export-mocks reads no file itself, which is what keeps it
// 'pre-edit' eligible.
const workspacePackageNames = configWorkspacePackageNamesBroker({
  startDir: filePathContract.parse(__dirname),
});

// Get the dungeonmaster configs (returns object with typescript, test, fileOverrides)
const dungeonmasterConfigs = configDungeonmasterBroker({ gatewayLintConfig, workspacePackageNames });
const dungeonmasterTestConfigs = configDungeonmasterBroker({
  forTesting: true,
  gatewayLintConfig,
  workspacePackageNames,
});

module.exports = [
  // Global ignores
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      'coverage/**',
      'tests/**',
      'packages/testing/playwright.config.ts',
      '**/.test-tmp/**',
      '**/_test-workspace/**',
      'packages/*/dist/**',
      'packages/@gateway/*/dist/**',
      '.ward/**',
      'packages/*/.ward/**',
      'packages/@gateway/*/.ward/**',
      '.ward-playwright-report*.json',
      'packages/*/.ward-playwright-report*.json',
      'packages/@gateway/*/.ward-playwright-report*.json',
      '@types/**',
      'exploratories/**',
      'scrolls/**',
      'hypothesis/**',
      '.vscode/**',
      '.idea/**',
      '.claude/**',
      '**/*.log',
      '**/*.min.js',
      '**/*.min.css',
      '.git/**',
      'v1/**',
      'worktrees/**',
      'siegelense-assets/**',
      'scripts/**',
      '**/*.d.ts',
      '*.md',
      '**/*.md',
      '**/ts-jest/**',
      // typescriptProgramDiagnosticsAdapter's own test fixtures carry a deliberate compiler
      // error so its test can assert on a real diagnostic — the adapter grades them directly,
      // so lint must skip them the same way it will skip the chunk-3 negative fixture tree.
      'packages/hydration/test/adapter-fixtures/**',
      // The declaration half of the negative type suite: each fixture holds exactly one
      // deliberate compile error (a malformed ingredient declaration), graded directly by
      // `typescriptProgramDiagnosticsAdapter`, never by this package's own lint or typecheck.
      'packages/hydration/test/type-fixtures/declaration/**',
      // The call-site half of the negative type suite: each fixture holds exactly one
      // deliberate compile error (a wrong chain call), graded directly by
      // `typescriptProgramDiagnosticsAdapter`, never by this package's own lint or typecheck.
      'packages/hydration/test/type-fixtures/call-site/**',
      // The positive fixture tree must compile clean under the adapter's own real tsc run;
      // it carries no deliberate error, but it is excluded the same way as its case-group
      // siblings so only that one mechanism ever grades it.
      'packages/hydration/test/type-fixtures/positive/**',
    ],
  },
  // Configuration for TypeScript files
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.js'],
    ignores: [
      'eslint.config.js',
      '**/jest.config.js',
      'jest.config.base.js',
      '**/jest-config-base.js',
      // Every jest setup entry, not just the one: these are plain CJS that no package tsconfig
      // includes, so typed linting cannot parse them.
      '**/jest.setup*.js',
      '**/configs/**/*.js',
      // The gateway carve-out: these files get the gateway rule block below instead — a
      // re-scoped, positive rule set, not this block's workspace rules minus some turned off.
      ...gatewayLocationsStatics.packageGlobs,
    ],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module',
        project: true,
        tsconfigRootDir: __dirname,
      },
    },
    plugins: {
      ...dungeonmasterConfigs.typescript.plugins,
      prettier: prettierPlugin,
      'eslint-comments': eslintCommentsPlugin,
      '@dungeonmaster': dungeonmasterPlugin,
      '@dungeonmaster-local': dungeonmasterLocalPlugin,
    },
    rules: {
      ...dungeonmasterConfigs.typescript.rules,
      ...prettierConfig.rules,
      'prettier/prettier': 'error',
      'arrow-body-style': ['error', 'as-needed'],
      'prefer-arrow-callback': 'error',
      '@dungeonmaster-local/ban-quest-status-literals': 'error',
      '@dungeonmaster-local/no-bare-location-literals': 'error',
      '@dungeonmaster-local/no-hardcoded-package-names': 'error',
      '@dungeonmaster-local/ban-locator-pick': 'error',
      '@dungeonmaster-local/ban-sync-seeding-methods': 'warn',
      '@dungeonmaster-local/ban-direct-io-in-test-scenarios': 'warn',
      '@dungeonmaster-local/graph-reachability': 'error',
      // 'eslint-comments/no-unlimited-disable': 'error',
      // 'eslint-comments/no-use': ['error', { allow: [] }],
    },
  },
  // The gateway's own positive rule set (packages/{npm,node,browser,bin}/src/**). Its tests
  // still get the test block below by file suffix, the same as every other package's tests.
  {
    files: dungeonmasterConfigs.gateway.files,
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module',
        project: true,
        tsconfigRootDir: __dirname,
      },
    },
    plugins: {
      ...dungeonmasterConfigs.gateway.plugins,
      prettier: prettierPlugin,
      'eslint-comments': eslintCommentsPlugin,
      '@dungeonmaster': dungeonmasterPlugin,
    },
    rules: {
      ...dungeonmasterConfigs.gateway.rules,
      ...prettierConfig.rules,
      'prettier/prettier': 'error',
      'arrow-body-style': ['error', 'as-needed'],
      'prefer-arrow-callback': 'error',
    },
  },
  // File-specific overrides (from dungeonmaster config)
  ...dungeonmasterConfigs.fileOverrides,
  // Test files can be more relaxed
  {
    files: ['**/*.test.ts', '**/*.test.tsx', '**/*.spec.ts', '**/*.harness.ts', '**/tests/**/*.ts'],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module',
        project: true,
        tsconfigRootDir: __dirname,
      },
      globals: {
        ...jestPlugin.environments.globals.globals,
      },
    },
    plugins: {
      ...dungeonmasterTestConfigs.test.plugins,
      prettier: prettierPlugin,
      'eslint-comments': eslintCommentsPlugin,
      jest: jestPlugin,
      '@dungeonmaster-local': dungeonmasterLocalPlugin,
    },
    rules: {
      ...dungeonmasterTestConfigs.test.rules,
      ...jestPlugin.configs.recommended.rules,
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/unbound-method': 'off',
      '@typescript-eslint/no-require-imports': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-empty-function': 'off',
      complexity: 'off',
      'max-lines-per-function': 'off',
      'max-nested-callbacks': 'off',
      'jest/unbound-method': 'off',
      '@dungeonmaster-local/ban-quest-status-literals': 'error',
      '@dungeonmaster-local/no-bare-location-literals': 'error',
      '@dungeonmaster-local/no-hardcoded-package-names': 'error',
      '@dungeonmaster-local/ban-locator-pick': 'error',
      '@dungeonmaster-local/ban-sync-seeding-methods': 'error',
      '@dungeonmaster-local/ban-direct-io-in-test-scenarios': 'off',
      '@dungeonmaster-local/graph-reachability': 'error',
    },
  },
  // Test file-specific overrides (from dungeonmaster test config)
  ...dungeonmasterTestConfigs.fileOverrides,
  // Promise constructor unavoidably requires 2 parameters (resolve, reject)
  {
    files: ['**/adapters/**/*-promise.ts'],
    rules: {
      '@typescript-eslint/max-params': ['error', { max: 2 }],
    },
  },
  // These are eslint tests so different structure
  {
    files: ['packages/{eslint-plugin,local-eslint}/src/brokers/rule/**'],
    ignores: ['**/*-layer-*.test.ts'], // Layer brokers are real brokers that need proxies
    rules: {
      'jest/require-hook': 'off',
      'jest/require-top-level-describe': 'off',
      'jest/no-hooks': 'off',
      '@dungeonmaster/ban-contract-in-tests': 'off',
      '@dungeonmaster/enforce-test-creation-of-proxy': 'off',
    },
  },
  {
    files: ['packages/eslint-plugin/src/adapters/eslint/rule-tester/eslint-rule-tester-adapter.ts'],
    rules: {
      '@dungeonmaster/require-contract-validation': 'off',
    },
  },
  // Narrow escape hatch: local-eslint is a workspace-internal ESLint plugin that imports ESLint primitives from @dungeonmaster/eslint-plugin subpaths, which aren't in the default allowed-import list.
  {
    files: ['packages/local-eslint/src/**'],
    rules: {
      '@dungeonmaster/enforce-import-dependencies': 'off',
    },
  },
  {
    files: ['packages/shared/src/@types/stub-argument.type.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
  {
    files: ['**/@types/*', '**/@types/**'],
    rules: {
      '@dungeonmaster/ban-primitives': 'off',
    },
  },
  // The hydration framework's generic type machinery declares things like `N extends number` and
  // `of: string` — bare primitives in type position, which this rule refuses everywhere it is on.
  // Scoped to the whole package, not to a handful of folders: contracts/ and transformers/ carry
  // that machinery, and so do the brokers that declare it against a caller's own generics
  // (ingredient-declare, registry-create, recipe-declare, hydration-create) — narrowing the glob
  // to today's folders only means the next file that needs it fails lint on arrival.
  {
    files: ['packages/hydration/src/**'],
    rules: {
      '@dungeonmaster/ban-primitives': 'off',
    },
  },
  {
    files: ['packages/shared/@types.ts'],
    rules: {
      '@dungeonmaster/forbid-type-reexport': 'off',
    },
  },
  // The standard type-testing `Equal<A, B>` idiom compares two function types, each generic over a
  // single unconstrained `T` used exactly once — that single use is the whole mechanism (it is what
  // makes `unknown` and `any` distinguishable, unlike `A extends B ? B extends A ? ... `). The rule
  // cannot tell this from an accidentally-unused type parameter; scoped to the one file that needs it.
  {
    files: ['packages/hydration/test/type-fixtures/expect.ts'],
    rules: {
      '@typescript-eslint/no-unnecessary-type-parameters': 'off',
    },
  },
  // The open-handle timer watcher's job is to replace the global timers so it sees every handle a
  // test opens; no gateway export can patch a global for every caller (EPIC.md concession 14).
  {
    files: ['packages/testing/src/brokers/timers/watch/timers-watch-broker.ts'],
    rules: {
      '@dungeonmaster/platform-globals-ban': 'off',
    },
  },
  // The web entry imports its three CSS files for Vite to bundle; no gateway export can carry a
  // side-effect stylesheet import (EPIC.md concession 9).
  {
    files: ['packages/web/src/main.ts'],
    rules: {
      '@dungeonmaster/raw-import-ban': 'off',
    },
  },
  // {
  //   files: ['packages/hooks/src/utils/hook-config/*.ts'],
  //   rules: {
  //     'eslint-comments/no-use': 'off',
  //   },
  // },
];
