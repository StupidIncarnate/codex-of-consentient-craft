import { HookConfigUtil } from './hook-config-util';
import { hookConfigUtilLoadConfig } from './hook-config-util-load-config';
import { hookConfigUtilMergeWithDefaults } from './hook-config-util-merge-with-defaults';
import { hookConfigUtilGetDefaultConfig } from './hook-config-util-get-default-config';
import { hookConfigUtilGetRuleNames } from './hook-config-util-get-rule-names';
import { hookConfigUtilGetRuleDisplayConfig } from './hook-config-util-get-rule-display-config';

describe('HookConfigUtil', () => {
  describe('object structure', () => {
    it('VALID: HookConfigUtil => exports all expected methods', () => {
      expect(HookConfigUtil).toStrictEqual({
        loadConfig: hookConfigUtilLoadConfig,
        mergeWithDefaults: hookConfigUtilMergeWithDefaults,
        getPreEditLintDefaultConfig: hookConfigUtilGetDefaultConfig,
        getRuleNames: hookConfigUtilGetRuleNames,
        getRuleDisplayConfig: hookConfigUtilGetRuleDisplayConfig,
      });
    });
  });

  describe('method delegation', () => {
    it('VALID: loadConfig({}) => calls underlying function', () => {
      const result = HookConfigUtil.loadConfig({});

      expect(result).toStrictEqual({
        rules: [
          '@typescript-eslint/no-explicit-any',
          '@typescript-eslint/ban-ts-comment',
          'eslint-comments/no-use',
        ],
      });
    });

    it('VALID: getPreEditLintDefaultConfig() => calls underlying function', () => {
      const result = HookConfigUtil.getPreEditLintDefaultConfig();

      expect(result).toStrictEqual({
        rules: [
          '@typescript-eslint/no-explicit-any',
          '@typescript-eslint/ban-ts-comment',
          'eslint-comments/no-use',
        ],
      });
    });

    it('VALID: getRuleNames({config}) => calls underlying function', () => {
      const config = {
        rules: ['rule1', 'rule2'],
      };

      const result = HookConfigUtil.getRuleNames({ config });

      expect(result).toStrictEqual(['rule1', 'rule2']);
    });
  });
});
