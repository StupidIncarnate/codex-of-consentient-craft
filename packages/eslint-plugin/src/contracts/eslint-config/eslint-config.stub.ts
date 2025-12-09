import { eslintConfigContract } from './eslint-config-contract';
import type { EslintConfig } from './eslint-config-contract';
import type { StubArgument } from '@dungeonmaster/shared/@types';

export const EslintConfigStub = ({ ...props }: StubArgument<EslintConfig> = {}): EslintConfig =>
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
