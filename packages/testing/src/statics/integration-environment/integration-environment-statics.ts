/**
 * PURPOSE: Defines immutable configuration values for integration test environments
 *
 * USAGE:
 * integrationEnvironmentStatics.constants.randomBytesLength;
 * // Returns 4
 */

export const integrationEnvironmentStatics = {
  constants: {
    randomBytesLength: 4,
    jsonIndentSpaces: 2,
  },
  paths: {
    baseDir: '/tmp',
  },
  packageJson: {
    version: '1.0.0',
    scripts: {
      test: 'echo "test placeholder"',
      lint: 'echo "lint placeholder"',
      typecheck: 'echo "typecheck placeholder"',
    },
  },
  tsconfig: {
    compilerOptions: {
      target: 'ES2020',
      module: 'commonjs',
      lib: ['ES2020'],
      strict: true,
      esModuleInterop: true,
      skipLibCheck: true,
      forceConsistentCasingInFileNames: true,
      resolveJsonModule: true,
      moduleResolution: 'node',
    },
    include: ['**/*.ts', '**/*.tsx'],
    exclude: ['node_modules'],
  },
  eslintConfig: {
    template: `
// Auto-generated eslint config for integration test environment
const tsParser = require('@typescript-eslint/parser');

module.exports = [
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: './tsconfig.json',
        tsconfigRootDir: __dirname,
      },
    },
  },
];
`,
  },
} as const;
