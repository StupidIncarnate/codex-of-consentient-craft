import { eslintRuleNameContract } from './eslint-rule-name-contract';
import type { EslintRuleName } from './eslint-rule-name-contract';

export const EslintRuleNameStub = (
  { value }: { value: string } = { value: 'test-rule' },
): EslintRuleName => eslintRuleNameContract.parse(value);
