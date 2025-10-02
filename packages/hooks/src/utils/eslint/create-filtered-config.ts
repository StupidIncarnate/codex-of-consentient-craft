import type { PreEditLintConfig } from '../../types/config-type';
import type { Linter } from 'eslint';
import { HookConfigUtil } from '../hook-config/hook-config-util';

export const createFilteredConfig = ({
  eslintConfig,
  hookConfig,
}: {
  eslintConfig: Linter.Config;
  hookConfig: PreEditLintConfig;
}): Linter.Config => {
  // Create new config with filtered rules
  const filteredRules: Record<string, Linter.RuleEntry> = {};

  // Only keep allowed rules, set others to 'off'
  const eslintRules = eslintConfig.rules;
  if (eslintRules !== undefined) {
    const ruleNames = HookConfigUtil.getRuleNames({ config: hookConfig });
    ruleNames.forEach((rule) => {
      const ruleValue = eslintRules[rule];
      if (ruleValue !== undefined) {
        filteredRules[rule] = ruleValue;
      }
    });
  }

  // Return new config with same structure but filtered rules
  const { language: _language, ...configWithoutLanguage } = eslintConfig;
  return {
    ...configWithoutLanguage,
    files: ['**/*.ts', '**/*.tsx'], // Ensure files pattern is set
    rules: filteredRules,
  };
};
