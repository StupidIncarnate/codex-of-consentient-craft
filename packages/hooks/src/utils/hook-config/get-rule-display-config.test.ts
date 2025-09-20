import { getRuleDisplayConfig } from './get-rule-display-config';
import type { PreEditLintConfig } from '../../types/config-type';

describe('getRuleDisplayConfig', () => {
  describe('valid input', () => {
    it('VALID: {config: with object rule, ruleId: "test-rule"} => returns display config', () => {
      const config: PreEditLintConfig = {
        rules: [
          'string-rule',
          {
            rule: 'test-rule',
            displayName: 'Test Rule',
            message: 'Custom test message',
          },
        ],
      };

      const result = getRuleDisplayConfig({
        config,
        ruleId: 'test-rule',
      });

      expect(result).toStrictEqual({
        displayName: 'Test Rule',
        message: 'Custom test message',
      });
    });

    it('VALID: {config: with partial object rule, ruleId: "partial-rule"} => returns partial config', () => {
      const config: PreEditLintConfig = {
        rules: [
          {
            rule: 'partial-rule',
            displayName: 'Partial Rule',
          },
        ],
      };

      const result = getRuleDisplayConfig({
        config,
        ruleId: 'partial-rule',
      });

      expect(result).toStrictEqual({
        displayName: 'Partial Rule',
        message: undefined,
      });
    });
  });

  describe('edge cases', () => {
    it('EDGE: {config: with string rules only, ruleId: "string-rule"} => returns empty object', () => {
      const config: PreEditLintConfig = {
        rules: ['string-rule', 'another-rule'],
      };

      const result = getRuleDisplayConfig({
        config,
        ruleId: 'string-rule',
      });

      expect(result).toStrictEqual({});
    });

    it('EDGE: {config: with rules, ruleId: "nonexistent"} => returns empty object', () => {
      const config: PreEditLintConfig = {
        rules: ['string-rule', { rule: 'object-rule', displayName: 'Object Rule' }],
      };

      const result = getRuleDisplayConfig({
        config,
        ruleId: 'nonexistent',
      });

      expect(result).toStrictEqual({});
    });

    it('EDGE: {config: {rules: []}, ruleId: "any-rule"} => returns empty object', () => {
      const config: PreEditLintConfig = {
        rules: [],
      };

      const result = getRuleDisplayConfig({
        config,
        ruleId: 'any-rule',
      });

      expect(result).toStrictEqual({});
    });
  });
});
