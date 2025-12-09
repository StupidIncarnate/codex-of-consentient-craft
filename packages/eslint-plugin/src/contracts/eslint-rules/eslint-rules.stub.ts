import { eslintRulesContract } from './eslint-rules-contract';
import type { EslintRules } from './eslint-rules-contract';
import type { StubArgument } from '@dungeonmaster/shared/@types';

export const EslintRulesStub = ({ ...props }: StubArgument<EslintRules> = {}): EslintRules =>
  eslintRulesContract.parse({
    ...props,
  });
