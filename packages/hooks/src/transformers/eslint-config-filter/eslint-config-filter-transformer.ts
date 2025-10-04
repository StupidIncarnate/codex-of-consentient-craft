import type { PreEditLintConfig } from '../../contracts/pre-edit-lint-config/pre-edit-lint-config-contract';
import type { Linter } from 'eslint';
import { ruleNamesExtractTransformer } from '../rule-names-extract/rule-names-extract-transformer';

export const eslintConfigFilterTransformer = ({
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
    const ruleNames = ruleNamesExtractTransformer({ config: hookConfig });
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
