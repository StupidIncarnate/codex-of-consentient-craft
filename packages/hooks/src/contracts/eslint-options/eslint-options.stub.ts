import type { StubArgument } from '@questmaestro/shared/@types';
import { eslintOptionsContract } from './eslint-options-contract';
import type { EslintOptions } from './eslint-options-contract';

export const EslintOptionsStub = ({ ...props }: StubArgument<EslintOptions> = {}): EslintOptions =>
  eslintOptionsContract.parse({
    overrideConfigFile: true,
    ...props,
  });
