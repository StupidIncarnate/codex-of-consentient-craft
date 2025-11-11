/**
 * PURPOSE: Filters ESLint config to only include rules specified in hook config
 *
 * USAGE:
 * const filtered = eslintConfigFilterTransformer({ eslintConfig, hookConfig });
 * // Returns LinterConfig with only allowed rules enabled
 */
import type { PreEditLintConfig } from '../../contracts/pre-edit-lint-config/pre-edit-lint-config-contract';
import type { LinterConfig } from '../../contracts/linter-config/linter-config-contract';
import { linterConfigContract } from '../../contracts/linter-config/linter-config-contract';
import { ruleNamesExtractTransformer } from '../rule-names-extract/rule-names-extract-transformer';

export const eslintConfigFilterTransformer = ({
  eslintConfig,
  hookConfig,
}: {
  eslintConfig: LinterConfig;
  hookConfig: PreEditLintConfig;
}): LinterConfig => {
  // Create new config with filtered rules
  const filteredRules: Record<PropertyKey, unknown> = {};

  // Only keep allowed rules, set others to 'off'
  const eslintRules = eslintConfig.rules;
  if (eslintRules !== undefined) {
    const ruleNames = ruleNamesExtractTransformer({ config: hookConfig });
    ruleNames.forEach((rule) => {
      // ESLint rules are always strings, filter out symbols
      if (typeof rule === 'string') {
        const ruleValue = eslintRules[rule];
        if (ruleValue !== undefined) {
          filteredRules[rule] = ruleValue;
        }
      }
    });
  }

  // Return new config with same structure but filtered rules
  const { language: _language, ...configWithoutLanguage } = eslintConfig;
  return linterConfigContract.parse({
    ...configWithoutLanguage,
    files: ['**/*.ts', '**/*.tsx'], // Ensure files pattern is set
    rules: filteredRules,
  });
};
