// Register TypeScript loader for development
require('ts-node/register');

const tsparser = require('@typescript-eslint/parser');
const prettierConfig = require('eslint-config-prettier');
const prettierPlugin = require('eslint-plugin-prettier');
const jestPlugin = require('eslint-plugin-jest');
const eslintCommentsPlugin = require('eslint-plugin-eslint-comments');
// Import our own questmaestro plugin and config directly from TypeScript source
const questmaestroPlugin = require('./packages/eslint-plugin/src/index.ts').default;
const {
  configQuestmaestroBroker,
} = require('./packages/eslint-plugin/src/brokers/config/questmaestro/config-questmaestro-broker.ts');

// Get the questmaestro configs (returns object with typescript, test, fileOverrides)
const questmaestroConfigs = configQuestmaestroBroker();
const questmaestroTestConfigs = configQuestmaestroBroker({ forTesting: true });

module.exports = [
  // Global ignores
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      'coverage/**',
      'tests/tmp/**',
      // '.test-tmp/**',
      // 'packages/*/.test-tmp/**',
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
      'packages/testing/**',
      '**/*.d.ts',
      '*.md',
      '**/*.md',
    ],
  },
  // Configuration for TypeScript files
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.js'],
    ignores: ['eslint.config.js', '**/jest.config.js', 'jest.config.base.js', '**/configs/**/*.js'],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module',
        project: './tsconfig.json',
      },
    },
    plugins: {
      ...questmaestroConfigs.typescript.plugins,
      prettier: prettierPlugin,
      'eslint-comments': eslintCommentsPlugin,
      '@questmaestro': questmaestroPlugin,
    },
    rules: {
      ...questmaestroConfigs.typescript.rules,
      ...prettierConfig.rules,
      'prettier/prettier': 'error',
      'arrow-body-style': ['error', 'as-needed'],
      'prefer-arrow-callback': 'error',
      // 'eslint-comments/no-unlimited-disable': 'error',
      // 'eslint-comments/no-use': ['error', { allow: [] }],
    },
  },
  // File-specific overrides (from questmaestro config)
  ...questmaestroConfigs.fileOverrides,
  // Test files can be more relaxed
  {
    files: ['**/*.test.ts', '**/tests/**/*.ts'],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module',
        project: './tsconfig.json',
      },
      globals: {
        ...jestPlugin.environments.globals.globals,
      },
    },
    plugins: {
      ...questmaestroTestConfigs.test.plugins,
      prettier: prettierPlugin,
      'eslint-comments': eslintCommentsPlugin,
      jest: jestPlugin,
    },
    rules: {
      ...questmaestroTestConfigs.test.rules,
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
  // Test file-specific overrides (from questmaestro test config)
  ...questmaestroTestConfigs.fileOverrides,
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
      '@questmaestro/ban-contract-in-tests': 'off',
      '@questmaestro/enforce-test-creation-of-proxy': 'off',
    },
  },
  {
    files: ['packages/eslint-plugin/src/adapters/eslint/rule-tester/eslint-rule-tester-adapter.ts'],
    rules: {
      '@questmaestro/require-contract-validation': 'off',
    },
  },
  {
    files: ['packages/shared/src/@types/stub-argument.type.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
  // {
  //   files: ['packages/hooks/src/utils/hook-config/*.ts'],
  //   rules: {
  //     'eslint-comments/no-use': 'off',
  //   },
  // },
];
