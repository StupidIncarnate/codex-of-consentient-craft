import { ESLint } from 'eslint';
import type { Linter } from 'eslint';

export interface FilteredESLintConfig {
  config: Linter.FlatConfig[];
  availableRules: Set<string>;
}

export const ESLintIntegration = {
  loadHostConfig: async ({
    cwd = process.cwd(),
    filePath = `${cwd}/sample.ts`,
  }: {
    cwd?: string;
    filePath?: string;
  } = {}): Promise<FilteredESLintConfig> => {
    try {
      const eslint = new ESLint({ cwd });

      // Get resolved config for the ACTUAL file from the hook
      const config = (await eslint.calculateConfigForFile(filePath)) as Linter.FlatConfig;

      // Collect all available rules
      const availableRules = new Set<string>();
      if (config.rules) {
        Object.keys(config.rules).forEach((rule) => availableRules.add(rule));
      }

      return {
        config: [config],
        availableRules,
      };
    } catch (error) {
      throw new Error(
        `Failed to load ESLint configuration: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  },

  createFilteredConfig: ({
    hostConfig,
    allowedRules,
  }: {
    hostConfig: FilteredESLintConfig;
    allowedRules: string[];
  }): Linter.FlatConfig[] =>
    hostConfig.config.map((config) => {
      // Create new config with filtered rules
      const filteredRules: Record<string, Linter.RuleEntry> = {};

      // Only keep allowed rules, set others to 'off'
      if (config.rules) {
        for (const [ruleName, ruleConfig] of Object.entries(config.rules)) {
          if (allowedRules.includes(ruleName)) {
            filteredRules[ruleName] = ruleConfig as Linter.RuleEntry;
          } else {
            filteredRules[ruleName] = 'off';
          }
        }
      }

      // Add any allowed rules that weren't in original config
      for (const ruleName of allowedRules) {
        if (!filteredRules[ruleName]) {
          filteredRules[ruleName] = 'error';
        }
      }

      // Return new config with same structure but filtered rules
      return {
        ...config,
        files: ['**/*'], // Apply to all files
        rules: filteredRules,
      };
    }),

  validateRulesExist: ({
    hostConfig,
    requestedRules,
  }: {
    hostConfig: FilteredESLintConfig;
    requestedRules: string[];
  }): { missingRules: string[]; availableRules: string[] } => {
    const missing: string[] = [];
    const available = Array.from(hostConfig.availableRules).sort();

    for (const rule of requestedRules) {
      if (!hostConfig.availableRules.has(rule)) {
        missing.push(rule);
      }
    }

    return {
      missingRules: missing,
      availableRules: available,
    };
  },
};
