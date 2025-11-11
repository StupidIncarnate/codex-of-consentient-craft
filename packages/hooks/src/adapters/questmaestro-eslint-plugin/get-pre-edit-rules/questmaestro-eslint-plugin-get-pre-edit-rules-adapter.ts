/**
 * PURPOSE: Retrieves pre-edit rule names from questmaestro eslint plugin configuration
 *
 * USAGE:
 * const ruleNames = questmaestroEslintPluginGetPreEditRulesAdapter();
 * // Returns array of rule names configured for pre-edit enforcement
 */
import type { PreEditLintConfig } from '../../../contracts/pre-edit-lint-config/pre-edit-lint-config-contract';
import { preEditLintConfigContract } from '../../../contracts/pre-edit-lint-config/pre-edit-lint-config-contract';
import { questmaestroRuleEnforceOnStatics } from '@questmaestro/shared/statics';

export const questmaestroEslintPluginGetPreEditRulesAdapter = (): PreEditLintConfig => {
  const preEditRules = Object.entries(questmaestroRuleEnforceOnStatics)
    .filter(([_ruleName, timing]) => timing === 'pre-edit')
    .map(([ruleName]) => ruleName);

  return preEditLintConfigContract.parse({
    rules: preEditRules,
  });
};
