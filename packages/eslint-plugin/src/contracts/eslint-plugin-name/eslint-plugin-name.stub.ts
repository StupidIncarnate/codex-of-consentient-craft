import { eslintPluginNameContract } from './eslint-plugin-name-contract';
import type { EslintPluginName } from './eslint-plugin-name-contract';

export const EslintPluginNameStub = (
  { value }: { value: string } = { value: '@typescript-eslint' },
): EslintPluginName => eslintPluginNameContract.parse(value);
