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
import type { AdapterResult } from '@dungeonmaster/shared/contracts';
import { adapterResultContract } from '@dungeonmaster/shared/contracts';
import type { EslintRules } from '../../contracts/eslint-rules/eslint-rules-contract';

export const eslintRulesDisableConflictsTransformer = ({
  mergedRules,
  overrideRules,
}: {
  mergedRules: EslintRules;
  overrideRules: EslintRules;
}): AdapterResult => {
  for (const ruleKey of Object.keys(overrideRules)) {
    const slashIndex = ruleKey.indexOf('/');
    if (slashIndex !== -1) {
      const baseRuleName = ruleKey.substring(slashIndex + 1);

      if (baseRuleName in mergedRules) {
        mergedRules[baseRuleName] = 'off';
      }
    }
  }
  return adapterResultContract.parse({ success: true });
};
