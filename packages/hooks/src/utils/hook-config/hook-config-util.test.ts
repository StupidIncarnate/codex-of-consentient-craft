import { HookConfigUtil } from './hook-config-util';
import { loadConfig } from './load-config';
import { mergeWithDefaults } from './merge-with-defaults';
import { getDefaultConfig } from './get-default-config';
import { getRuleNames } from './get-rule-names';
import { getRuleDisplayConfig } from './get-rule-display-config';

describe('HookConfigUtil', () => {
  describe('object structure', () => {
    it('VALID: HookConfigUtil => exports all expected methods', () => {
      expect(HookConfigUtil).toStrictEqual({
        loadConfig,
        mergeWithDefaults,
        getPreEditLintDefaultConfig: getDefaultConfig,
        getRuleNames,
        getRuleDisplayConfig,
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
