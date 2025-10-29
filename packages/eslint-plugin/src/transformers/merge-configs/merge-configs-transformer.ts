import type { EslintConfig } from '../../contracts/eslint-config/eslint-config-contract';

/**
 * PURPOSE: Combines multiple ESLint configuration objects into a single merged configuration
 *
 * USAGE:
 * const merged = mergeConfigsTransformer({
 *   configs: [baseConfig, typescriptConfig, customRules]
 * });
 * // Returns: Single config with all plugins, rules, languageOptions, files, and ignores merged
 */
export const mergeConfigsTransformer = ({ configs }: { configs: EslintConfig[] }): EslintConfig => {
  const merged: EslintConfig = {
    plugins: {},
    rules: {},
    languageOptions: {},
    files: [],
    ignores: [],
  };

  for (const config of configs) {
    merged.plugins = { ...merged.plugins, ...config.plugins };
    merged.rules = { ...merged.rules, ...config.rules };
    merged.languageOptions = { ...merged.languageOptions, ...config.languageOptions };
    merged.files = [...(merged.files ?? []), ...(config.files ?? [])];
    merged.ignores = [...(merged.ignores ?? []), ...(config.ignores ?? [])];
  }

  return merged;
};
