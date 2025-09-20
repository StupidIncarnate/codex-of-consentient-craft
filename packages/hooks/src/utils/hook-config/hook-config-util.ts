import { loadConfig } from './load-config';
import { mergeWithDefaults } from './merge-with-defaults';
import { getDefaultConfig } from './get-default-config';
import { getRuleNames } from './get-rule-names';
import { getRuleDisplayConfig } from './get-rule-display-config';

export const HookConfigUtil = {
  loadConfig: loadConfig,
  mergeWithDefaults: mergeWithDefaults,
  getPreEditLintDefaultConfig: getDefaultConfig,
  getRuleNames: getRuleNames,
  getRuleDisplayConfig: getRuleDisplayConfig,
};
