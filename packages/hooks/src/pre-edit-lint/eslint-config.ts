import { ESLint } from 'eslint';
import type { Linter } from 'eslint';
import type { PreEditLintConfig } from './types';

// Cache the config to avoid repeated expensive loading
let configCache: { cwd: string; config: Linter.Config } | null = null;

export const EslintConfig = {
  loadConfigByFile: async ({
    cwd = process.cwd(),
    filePath,
  }: {
    cwd?: string;
    filePath: string;
  }) => {
    // Return cached config if same cwd
    if (configCache && configCache.cwd === cwd) {
      return configCache.config;
    }

    try {
      const eslint = new ESLint({ cwd });

      // Get resolved config for the ACTUAL file from the hook
      const config: Linter.Config = (await eslint.calculateConfigForFile(filePath)) || {};

      // Cache the result
      configCache = { cwd, config };

      return config;
    } catch (error) {
      throw new Error(
        `Failed to load ESLint configuration: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  },

  createFilteredConfig: ({
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
      hookConfig.rules.forEach((rule) => {
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
  },
};
