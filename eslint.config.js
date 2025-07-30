const tseslint = require('@typescript-eslint/eslint-plugin');
const tsparser = require('@typescript-eslint/parser');
const prettierConfig = require('eslint-config-prettier');
const prettierPlugin = require('eslint-plugin-prettier');
const jestPlugin = require('eslint-plugin-jest');
const eslintCommentsPlugin = require('eslint-plugin-eslint-comments');
const { fixupConfigRules } = require('@eslint/compat');
const { FlatCompat } = require('@eslint/eslintrc');

const compat = new FlatCompat();

module.exports = [
  // Global ignores
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      'coverage/**',
      'tests/tmp/**',
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
      'jest.config.js',
      'jest.setup.js',
      'eslint.config.js'
    ]
  },
  // Main configuration for all TypeScript and JavaScript files
  {
    files: ['**/*.ts', '**/*.js'],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module',
        project: './tsconfig.json'
      }
    },
    plugins: {
      '@typescript-eslint': tseslint,
      'prettier': prettierPlugin,
      'eslint-comments': eslintCommentsPlugin
    },
    rules: {
      ...tseslint.configs.recommended.rules,
      ...tseslint.configs['recommended-requiring-type-checking'].rules,
      ...prettierConfig.rules,
      'prettier/prettier': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { 
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        caughtErrorsIgnorePattern: '^_'
      }],
      'arrow-body-style': ['error', 'as-needed'],
      'prefer-arrow-callback': 'error',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      'eslint-comments/no-unlimited-disable': 'error',
      'eslint-comments/no-use': ['error', { allow: [] }]
    }
  },
  // Test files can be more relaxed
  {
    files: ['**/*.test.ts', '**/*.test.js', '**/tests/**/*.ts'],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module',
        project: './tsconfig.json'
      },
      globals: {
        ...jestPlugin.environments.globals.globals
      }
    },
    plugins: {
      '@typescript-eslint': tseslint,
      'jest': jestPlugin
    },
    rules: {
      ...jestPlugin.configs.recommended.rules,
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/unbound-method': 'off',
      'jest/unbound-method': 'off'
    }
  }
];