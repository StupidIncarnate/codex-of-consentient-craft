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
  questmaestroConfigBroker,
} = require('./packages/eslint-plugin/src/brokers/config/questmaestro/questmaestro-config-broker.ts');

// Get the questmaestro configs
const questmaestroConfig = questmaestroConfigBroker();
const questmaestroTestConfig = questmaestroConfigBroker({ forTesting: true });

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
      'packages/testing/**'
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
      ...questmaestroConfig.plugins,
      prettier: prettierPlugin,
      'eslint-comments': eslintCommentsPlugin,
      '@questmaestro': questmaestroPlugin,
    },
    rules: {
      ...questmaestroConfig.rules,
      ...prettierConfig.rules,
      'prettier/prettier': 'error',
      'arrow-body-style': ['error', 'as-needed'],
      'prefer-arrow-callback': 'error',
      // 'eslint-comments/no-unlimited-disable': 'error',
      // 'eslint-comments/no-use': ['error', { allow: [] }],
    },
  },
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
      ...questmaestroTestConfig.plugins,
      prettier: prettierPlugin,
      'eslint-comments': eslintCommentsPlugin,
      jest: jestPlugin,
    },
    rules: {
      ...questmaestroTestConfig.rules,
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
  // Promise constructor unavoidably requires 2 parameters (resolve, reject)
  {
    files: ['**/adapters/**/*-promise.ts'],
    rules: {
      '@typescript-eslint/max-params': ['error', { max: 2 }],
    },
  },
  // {
  //   files: ['packages/hooks/src/utils/hook-config/*.ts'],
  //   rules: {
  //     'eslint-comments/no-use': 'off',
  //   },
  // },
];
