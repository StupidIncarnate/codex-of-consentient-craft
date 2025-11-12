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
import { rawEslintConfigToPartialTransformer } from '../raw-eslint-config-to-partial/raw-eslint-config-to-partial-transformer';

export const eslintConfigFilterTransformer = ({
  eslintConfig,
  hookConfig,
}: {
  eslintConfig: unknown;
  hookConfig: PreEditLintConfig;
}): LinterConfig => {
  // Transform raw ESLint config to partial config (strips language field)
  const partialConfig = rawEslintConfigToPartialTransformer({ rawConfig: eslintConfig });

  // Extract required fields from raw config (needed for ESLint to work properly)
  const rawConfigObj = typeof eslintConfig === 'object' && eslintConfig !== null ? eslintConfig : {};
  const plugins: unknown = Reflect.get(rawConfigObj, 'plugins');
  const languageOptions: unknown = Reflect.get(rawConfigObj, 'languageOptions');

  // Create new config with filtered rules
  const filteredRules: Record<PropertyKey, unknown> = {};

  // Only keep allowed rules, set others to 'off'
  const eslintRules = partialConfig.rules;
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

  // Return new validated config with filtered rules and required ESLint fields
  return linterConfigContract.parse({
    files: ['**/*.ts', '**/*.tsx'], // Ensure files pattern is set
    rules: filteredRules,
    ...(plugins !== undefined && { plugins }),
    ...(languageOptions !== undefined && { languageOptions }),
  });
};
