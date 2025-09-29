import type { EslintConfig } from '../../contracts/eslint-config/eslint-config-contract';

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
      for (const ruleKey of Object.keys(override.rules)) {
        const slashIndex = ruleKey.indexOf('/');
        if (slashIndex !== -1) {
          const baseRuleName = ruleKey.substring(slashIndex + 1);

          // If reference has this base rule, turn it off
          if (baseRuleName in mergedRules) {
            mergedRules[baseRuleName] = 'off';
          }
        }
      }
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
