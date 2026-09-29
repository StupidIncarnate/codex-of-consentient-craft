require('tsx/cjs');
const tsparser = require('@typescript-eslint/parser');
const plugin = require('../packages/eslint-plugin/src/index.ts').default;
const { gatewayLocationsStatics } = require('@dungeonmaster/shared/statics');
module.exports = [
  {
    files: ['**/*.ts', '**/*.tsx'],
    ignores: [...gatewayLocationsStatics.packageGlobs, '**/*.d.ts', '**/dist/**', '**/node_modules/**'],
    languageOptions: {
      parser: tsparser,
      parserOptions: { ecmaVersion: 2020, sourceType: 'module', ecmaFeatures: { jsx: true }, project: true, tsconfigRootDir: __dirname + '/..' },
    },
    plugins: { '@dungeonmaster': plugin },
    rules: {
      '@dungeonmaster/raw-import-ban': 'error',
      '@dungeonmaster/platform-globals-ban': 'error',
      '@dungeonmaster/bin-program-spawn-ban': 'error',
    },
  },
];
