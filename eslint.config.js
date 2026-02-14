// Register TypeScript loader for development
require('ts-node/register');

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

// Get the dungeonmaster configs (returns object with typescript, test, fileOverrides)
const dungeonmasterConfigs = configDungeonmasterBroker();
const dungeonmasterTestConfigs = configDungeonmasterBroker({ forTesting: true });

module.exports = [
  // Global ignores
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      'coverage/**',
      'tests/tmp/**',
      'tests/e2e/**',
      '**/.test-tmp/**',
      'packages/*/dist/**',
      '@types/**',
      'exploratories/**',
      'plan/**',
      'hypothesis/**',
      '.vscode/**',
      '.idea/**',
      '.claude/**',
      '**/*.log',
      '**/*.min.js',
      '**/*.min.css',
      '.git/**',
      'v1/**',
      '**/test/**',
      '**/*.d.ts',
      '*.md',
      '**/*.md',
      '**/ts-jest/**',
    ],
  },
  // Configuration for TypeScript files
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.js'],
    ignores: [
      'eslint.config.js',
      '**/jest.config.js',
      'jest.config.base.js',
      '**/jest.setup.js',
      '**/configs/**/*.js',
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
    },
    rules: {
      ...dungeonmasterConfigs.typescript.rules,
      ...prettierConfig.rules,
      'prettier/prettier': 'error',
      'arrow-body-style': ['error', 'as-needed'],
      'prefer-arrow-callback': 'error',
      // 'eslint-comments/no-unlimited-disable': 'error',
      // 'eslint-comments/no-use': ['error', { allow: [] }],
    },
  },
  // File-specific overrides (from dungeonmaster config)
  ...dungeonmasterConfigs.fileOverrides,
  // Test files can be more relaxed
  {
    files: ['**/*.test.ts', '**/*.test.tsx', '**/tests/**/*.ts'],
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
    files: ['packages/eslint-plugin/src/brokers/rule/**'],
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
  {
    files: ['packages/shared/src/@types/stub-argument.type.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
  {
    // ts-jest needs the scalar exports
    files: [
      'packages/testing/src/adapters/typescript/proxy-mock-transformer/typescript-proxy-mock-transformer-adapter.ts',
    ],
    rules: {
      '@dungeonmaster/enforce-project-structure': 'off',
    },
  },
  {
    files: ['**/@types/*', '**/@types/**'],
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
  /**
   * We have to mock outside the function because import()/require() has weird hoisting rules.
   */
  {
    files: [
      'packages/shared/src/adapters/runtime/dynamic-import/runtime-dynamic-import-adapter.proxy.ts',
    ],
    rules: {
      '@dungeonmaster/enforce-proxy-patterns': 'off',
    },
  },
  // {
  //   files: ['packages/hooks/src/utils/hook-config/*.ts'],
  //   rules: {
  //     'eslint-comments/no-use': 'off',
  //   },
  // },
];
