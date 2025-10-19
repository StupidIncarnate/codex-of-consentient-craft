import type { EslintRules } from '../../contracts/eslint-rules/eslint-rules-contract';

export const eslintRulesDisableConflictsTransformer = ({
  mergedRules,
  overrideRules,
}: {
  mergedRules: EslintRules;
  overrideRules: EslintRules;
}): void => {
  for (const ruleKey of Object.keys(overrideRules)) {
    const slashIndex = ruleKey.indexOf('/');
    if (slashIndex !== -1) {
      const baseRuleName = ruleKey.substring(slashIndex + 1);

      // If reference has this base rule, turn it off
      if (baseRuleName in mergedRules) {
        mergedRules[baseRuleName] = 'off';
      }
    }
  }
};
