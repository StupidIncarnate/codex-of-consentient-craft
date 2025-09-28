import type { EslintConfig } from '../../contracts/eslint-config/eslint-config-contract';

export const mergeConfigsTransformer = ({ configs }: { configs: EslintConfig[] }): EslintConfig => {
  const merged: EslintConfig = {
    plugins: {},
    rules: {},
    languageOptions: {},
    files: [],
    ignores: [],
  };

  for (const config of configs) {
    if (config.plugins) {
      merged.plugins = { ...merged.plugins, ...config.plugins };
    }

    if (config.rules) {
      merged.rules = { ...merged.rules, ...config.rules };
    }

    if (config.languageOptions) {
      merged.languageOptions = { ...merged.languageOptions, ...config.languageOptions };
    }

    if (config.files) {
      merged.files = [...(merged.files || []), ...config.files];
    }

    if (config.ignores) {
      merged.ignores = [...(merged.ignores || []), ...config.ignores];
    }
  }

  return merged;
};
