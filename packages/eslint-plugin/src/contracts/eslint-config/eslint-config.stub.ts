import { eslintConfigContract } from './eslint-config-contract';
import type { EslintConfig } from './eslint-config-contract';

export const EslintConfigStub = (props: Partial<EslintConfig> = {}): EslintConfig =>
  eslintConfigContract.parse({
    plugins: {},
    rules: {},
    languageOptions: {
      parser: undefined,
      parserOptions: {},
      globals: {},
    },
    files: ['**/*.ts'],
    ignores: ['node_modules'],
    ...props,
  });
