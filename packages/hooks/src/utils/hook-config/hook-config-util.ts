import { hookConfigUtilLoadConfig } from './hook-config-util-load-config';
import { hookConfigUtilMergeWithDefaults } from './hook-config-util-merge-with-defaults';
import { hookConfigUtilGetDefaultConfig } from './hook-config-util-get-default-config';
import { hookConfigUtilGetRuleNames } from './hook-config-util-get-rule-names';
import { hookConfigUtilGetRuleDisplayConfig } from './hook-config-util-get-rule-display-config';

export const HookConfigUtil = {
  loadConfig: hookConfigUtilLoadConfig,
  mergeWithDefaults: hookConfigUtilMergeWithDefaults,
  getPreEditLintDefaultConfig: hookConfigUtilGetDefaultConfig,
  getRuleNames: hookConfigUtilGetRuleNames,
  getRuleDisplayConfig: hookConfigUtilGetRuleDisplayConfig,
};
