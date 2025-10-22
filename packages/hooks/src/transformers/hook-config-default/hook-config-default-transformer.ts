import type { PreEditLintConfig } from '../../contracts/pre-edit-lint-config/pre-edit-lint-config-contract';
import { preEditLintConfigContract } from '../../contracts/pre-edit-lint-config/pre-edit-lint-config-contract';
import { configQuestmaestroBroker } from '@questmaestro/eslint-plugin';

export const hookConfigDefaultTransformer = (): PreEditLintConfig => {
  const { ruleEnforceOn } = configQuestmaestroBroker({ forTesting: false });

  const preEditRules = Object.entries(ruleEnforceOn)
    .filter(([_, timing]) => timing === 'pre-edit')
    .map(([ruleName]) => ruleName);

  return preEditLintConfigContract.parse({
    rules: preEditRules,
  });
};
