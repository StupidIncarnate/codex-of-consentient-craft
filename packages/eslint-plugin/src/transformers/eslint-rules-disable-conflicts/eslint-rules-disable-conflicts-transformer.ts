/**
 * PURPOSE: Disables base ESLint rules that conflict with plugin-specific rules
 *
 * USAGE:
 * const merged = {};
 * eslintRulesDisableConflictsTransformer({
 *   mergedRules: merged,
 *   overrideRules: { '@typescript-eslint/no-unused-vars': 'error' }
 * });
 * // Sets merged['no-unused-vars'] = 'off'
 *
 * WHEN-TO-USE: When TypeScript ESLint or other plugins override base ESLint rules
 */
import type { TSESLint } from '#gateway/npm/typescript-eslint__utils';

export const eslintRulesDisableConflictsTransformer = ({
  mergedRules,
  overrideRules,
}: {
  mergedRules: TSESLint.SharedConfig.RulesRecord;
  overrideRules: TSESLint.SharedConfig.RulesRecord;
}): void => {
  for (const ruleKey of Object.keys(overrideRules)) {
    const slashIndex = ruleKey.indexOf('/');
    if (slashIndex !== -1) {
      const baseRuleName = ruleKey.substring(slashIndex + 1);

      if (baseRuleName in mergedRules) {
        mergedRules[baseRuleName] = 'off';
      }
    }
  }
};
