/**
 * PURPOSE: Combines multiple ESLint configuration objects into a single merged configuration
 *
 * USAGE:
 * const merged = mergeConfigsTransformer({
 *   configs: [baseConfig, typescriptConfig, customRules]
 * });
 * // Returns: Single config with all plugins, rules, languageOptions, files, and ignores merged
 */
import type { TSESLint } from '#gateway/npm/typescript-eslint__utils';

export const mergeConfigsTransformer = ({
  configs,
}: {
  configs: TSESLint.FlatConfig.Config[];
}): TSESLint.FlatConfig.Config => {
  const merged: TSESLint.FlatConfig.Config = {
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
