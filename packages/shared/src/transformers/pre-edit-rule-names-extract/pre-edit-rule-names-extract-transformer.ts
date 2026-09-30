/**
 * PURPOSE: Extracts rule names configured for pre-edit enforcement from rule enforcement mapping
 *
 * USAGE:
 * import { preEditRuleNamesExtractTransformer } from '@dungeonmaster/shared/transformers';
 * import { dungeonmasterRuleEnforceOnStatics } from '@dungeonmaster/shared/statics';
 * const ruleNames = preEditRuleNamesExtractTransformer({ enforceOn: dungeonmasterRuleEnforceOnStatics });
 * // Returns ContentText[] of pre-edit rule names
 *
 * WHEN-TO-USE: When retrieving the list of ESLint rules that should run during pre-edit hook execution
 */

import type { dungeonmasterRuleEnforceOnStatics } from '../../statics/dungeonmaster-rule-enforce-on/dungeonmaster-rule-enforce-on-statics';

export const preEditRuleNamesExtractTransformer = ({
  enforceOn,
}: {
  enforceOn: Record<
    string,
    (typeof dungeonmasterRuleEnforceOnStatics)[keyof typeof dungeonmasterRuleEnforceOnStatics]
  >;
}): string[] =>
  Object.entries(enforceOn)
    .filter(([, timing]) => timing === 'pre-edit')
    .map(([ruleName]) => ruleName);
