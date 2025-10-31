/**
 * PURPOSE: Merges ESLint configurations while resolving rule conflicts between base and plugin rules
 *
 * USAGE:
 * const merged = eslintConflictResolverTransformer({
 *   reference: baseConfig,
 *   overrides: [typescriptConfig, jestConfig]
 * });
 * // Returns merged config with conflicting base rules disabled
 *
 * WHEN-TO-USE: When combining multiple ESLint configs with overlapping rule names
 */
import type { EslintConfig } from '../../contracts/eslint-config/eslint-config-contract';
import { eslintRulesDisableConflictsTransformer } from '../eslint-rules-disable-conflicts/eslint-rules-disable-conflicts-transformer';

export const eslintConflictResolverTransformer = ({
  reference,
  overrides,
}: {
  reference: EslintConfig;
  overrides: EslintConfig[];
}): EslintConfig => {
  const mergedRules = { ...reference.rules };

  // Process each override config in order
  for (const override of overrides) {
    // Extract rule names from plugin rules like '@typescript-eslint/rule-name' → 'rule-name'
    if (override.rules) {
      eslintRulesDisableConflictsTransformer({ mergedRules, overrideRules: override.rules });
    }
  }

  // Merge all rules: reference (with conflicts off) + all overrides
  const allRules = { ...mergedRules };
  for (const override of overrides) {
    if (override.rules) {
      Object.assign(allRules, override.rules);
    }
  }

  // Merge all plugins
  const allPlugins = { ...reference.plugins };
  for (const override of overrides) {
    if (override.plugins) {
      Object.assign(allPlugins, override.plugins);
    }
  }

  return {
    plugins: allPlugins,
    rules: allRules,
  };
};
