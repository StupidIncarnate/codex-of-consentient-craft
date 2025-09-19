import type { PreEditLintConfig } from '../../types/config-type';
import type { Linter } from 'eslint';
import { HookConfigUtil } from '../hook-config/hook-config-util';

export const eslintUtilCreatFilteredConfig = ({
  eslintConfig,
  hookConfig,
}: {
  eslintConfig: Linter.Config;
  hookConfig: PreEditLintConfig;
}): Linter.Config => {
  // Create new config with filtered rules
  const filteredRules: Record<string, Linter.RuleEntry> = {};

  // Only keep allowed rules, set others to 'off'
  if (eslintConfig.rules) {
    const ruleNames = HookConfigUtil.getRuleNames({ config: hookConfig });
    ruleNames.forEach((rule) => {
      if (eslintConfig.rules?.[rule]) {
        filteredRules[rule] = eslintConfig.rules[rule];
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
