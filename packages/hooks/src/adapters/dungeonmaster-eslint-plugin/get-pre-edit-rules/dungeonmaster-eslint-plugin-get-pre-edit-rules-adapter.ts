/**
 * PURPOSE: Retrieves pre-edit rule names from dungeonmaster eslint plugin configuration
 *
 * USAGE:
 * const ruleNames = dungeonmasterEslintPluginGetPreEditRulesAdapter();
 * // Returns array of rule names configured for pre-edit enforcement
 */
import type { PreEditLintConfig } from '../../../contracts/pre-edit-lint-config/pre-edit-lint-config-contract';
import { preEditLintConfigContract } from '../../../contracts/pre-edit-lint-config/pre-edit-lint-config-contract';
import { dungeonmasterRuleEnforceOnStatics } from '@dungeonmaster/shared/statics';

export const dungeonmasterEslintPluginGetPreEditRulesAdapter = (): PreEditLintConfig => {
  const preEditRules = Object.entries(dungeonmasterRuleEnforceOnStatics)
    .filter(([_ruleName, timing]) => timing === 'pre-edit')
    .map(([ruleName]) => ruleName);

  return preEditLintConfigContract.parse({
    rules: preEditRules,
  });
};
