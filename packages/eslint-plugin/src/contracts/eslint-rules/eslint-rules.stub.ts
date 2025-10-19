import { eslintRulesContract } from './eslint-rules-contract';
import type { EslintRules } from './eslint-rules-contract';
import type { StubArgument } from '@questmaestro/shared/@types';

export type { EslintRules };

export const EslintRulesStub = ({ ...props }: StubArgument<EslintRules> = {}): EslintRules =>
  eslintRulesContract.parse({
    ...props,
  });
