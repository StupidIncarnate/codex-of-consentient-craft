import { eslintPluginContract } from './eslint-plugin-contract';
import type { EslintPlugin } from './eslint-plugin-contract';
import type { StubArgument } from '@questmaestro/shared/@types';

export const EslintPluginStub = ({ ...props }: StubArgument<EslintPlugin> = {}): EslintPlugin =>
  eslintPluginContract.parse({
    rules: {},
    ...props,
  });
