import { ESLintIntegration } from './eslint-integration';
import type { PreEditLintConfig } from './types';

export const ConfigValidator = {
  validateConfig: async ({
    config,
    cwd = process.cwd(),
  }: {
    config: PreEditLintConfig;
    cwd?: string;
  }): Promise<void> => {
    // Skip validation if disabled
    if (config.validateRules === false) {
      return;
    }

    try {
      // Load the host's ESLint configuration
      const hostConfig = await ESLintIntegration.loadHostConfig({ cwd });

      // Validate that all requested rules exist
      const { missingRules, availableRules } = ESLintIntegration.validateRulesExist({
        hostConfig,
        requestedRules: config.rules,
      });

      if (missingRules.length > 0) {
        const errorMessage = ConfigValidator.formatMissingRulesError({
          missingRules,
          availableRules,
        });
        throw new Error(errorMessage);
      }
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error(`Config validation failed: ${String(error)}`);
    }
  },

  formatMissingRulesError: ({
    missingRules,
    availableRules,
  }: {
    missingRules: string[];
    availableRules: string[];
  }): string => {
    const lines = ['🛑 Pre-edit lint configuration error:'];
    lines.push('');

    if (missingRules.length === 1) {
      lines.push(`Rule '${missingRules[0]}' not found in your ESLint configuration.`);
    } else {
      lines.push(`${missingRules.length} rules not found in your ESLint configuration:`);
      for (const rule of missingRules) {
        lines.push(`  ❌ ${rule}`);
      }
    }

    lines.push('');
    lines.push('These rules must be configured in your eslint.config.js file.');

    // Suggest similar rules for each missing rule
    for (const missingRule of missingRules) {
      const suggestions = ConfigValidator.findSimilarRules({
        missingRule,
        availableRules,
      });

      if (suggestions.length > 0) {
        lines.push('');
        lines.push(`Similar rules available for '${missingRule}':`);
        for (const suggestion of suggestions.slice(0, 3)) {
          lines.push(`  💡 ${suggestion}`);
        }
      }
    }

    // Show a sample of available rules
    const typeScriptRules = availableRules.filter((rule) => rule.startsWith('@typescript-eslint/'));
    const pluginRules = availableRules.filter(
      (rule) => rule.includes('/') && !rule.startsWith('@typescript-eslint/'),
    );
    const coreRules = availableRules.filter((rule) => !rule.includes('/'));

    if (typeScriptRules.length > 0) {
      lines.push('');
      lines.push(`Available TypeScript rules (${typeScriptRules.length} total):`);
      lines.push(
        `  ${typeScriptRules.slice(0, 5).join(', ')}${typeScriptRules.length > 5 ? ', ...' : ''}`,
      );
    }

    if (pluginRules.length > 0) {
      lines.push('');
      lines.push(`Available plugin rules (${pluginRules.length} total):`);
      lines.push(`  ${pluginRules.slice(0, 5).join(', ')}${pluginRules.length > 5 ? ', ...' : ''}`);
    }

    if (coreRules.length > 0) {
      lines.push('');
      lines.push(`Available core ESLint rules (${coreRules.length} total):`);
      lines.push(`  ${coreRules.slice(0, 5).join(', ')}${coreRules.length > 5 ? ', ...' : ''}`);
    }

    return lines.join('\n');
  },

  findSimilarRules: ({
    missingRule,
    availableRules,
  }: {
    missingRule: string;
    availableRules: string[];
  }): string[] => {
    const ruleName = missingRule.includes('/') ? missingRule.split('/').slice(-1)[0] : missingRule;

    const ruleWords = ruleName.split(/[-_]/).filter(Boolean);

    const scored = availableRules
      .map((availableRule) => {
        const availableName = availableRule.includes('/')
          ? availableRule.split('/').slice(-1)[0]
          : availableRule;

        const availableWords = availableName.split(/[-_]/).filter(Boolean);

        let score = 0;

        // Exact match on rule name (without plugin prefix)
        if (ruleName === availableName) {
          score += 100;
        }

        // Check for word matches
        for (const word of ruleWords) {
          if (availableWords.includes(word)) {
            score += 10;
          }
          if (availableName.includes(word)) {
            score += 5;
          }
        }

        // Prefer same plugin family
        const missingPlugin = missingRule.includes('/') ? missingRule.split('/')[0] : '';
        const availablePlugin = availableRule.includes('/') ? availableRule.split('/')[0] : '';
        if (missingPlugin && missingPlugin === availablePlugin) {
          score += 20;
        }

        return { rule: availableRule, score };
      })
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score);

    return scored.slice(0, 5).map((item) => item.rule);
  },
};
