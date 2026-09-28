/**
 * PURPOSE: Retrieves default pre-edit lint configuration from dungeonmaster eslint plugin
 *
 * USAGE:
 * const defaultConfig = hookConfigDefaultBroker();
 * // Returns PreEditLintConfig with all pre-edit rules from eslint-plugin
 */
import { preEditRuleNamesExtractTransformer } from '@dungeonmaster/shared/transformers';
import { dungeonmasterRuleEnforceOnStatics } from '@dungeonmaster/shared/statics';
import {
  preEditLintConfigContract,
  type PreEditLintConfig,
} from '../../../contracts/pre-edit-lint-config/pre-edit-lint-config-contract';

export const hookConfigDefaultBroker = (): PreEditLintConfig => {
  const rules = preEditRuleNamesExtractTransformer({
    enforceOn: dungeonmasterRuleEnforceOnStatics,
  });

  return preEditLintConfigContract.parse({
    rules,
  });
};
